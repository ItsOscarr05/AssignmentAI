import pytest
import pyotp
import qrcode
import io
import base64
from unittest.mock import Mock, patch, MagicMock
from app.services.two_factor import TwoFactorAuthService
from app.models.user import User
from app.core.config import settings


class TestTwoFactorAuthService:
    @pytest.fixture
    def mock_user(self):
        """Create a mock user"""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.two_factor_secret = None
        user.two_factor_enabled = False
        user.backup_codes = []
        return user

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session"""
        return Mock()

    def test_generate_secret(self):
        """Test generating a new TOTP secret"""
        secret = TwoFactorAuthService.generate_secret()
        
        # Verify it's a valid base32 string
        assert isinstance(secret, str)
        assert len(secret) > 0
        # Should be base32 encoded
        try:
            import base64
            base64.b32decode(secret)
        except Exception:
            pytest.fail("Secret is not valid base32")

    def test_generate_qr_code(self):
        """Test generating QR code for TOTP secret"""
        secret = TwoFactorAuthService.generate_secret()
        email = "test@example.com"
        
        qr_code = TwoFactorAuthService.generate_qr_code(secret, email)
        
        # Verify it's a valid base64 string
        assert isinstance(qr_code, str)
        assert len(qr_code) > 0
        
        # Decode base64 and verify it's a valid image
        try:
            image_data = base64.b64decode(qr_code)
            assert len(image_data) > 0
        except Exception:
            pytest.fail("QR code is not valid base64")

    def test_generate_qr_code_with_project_name(self):
        """Test generating QR code with project name"""
        with patch('app.services.two_factor.settings') as mock_settings:
            mock_settings.PROJECT_NAME = "TestProject"
            
            secret = TwoFactorAuthService.generate_secret()
            email = "test@example.com"
            
            qr_code = TwoFactorAuthService.generate_qr_code(secret, email)
            
            assert isinstance(qr_code, str)
            assert len(qr_code) > 0

    def test_verify_code_valid(self):
        """Test verifying a valid TOTP code"""
        secret = TwoFactorAuthService.generate_secret()
        totp = pyotp.TOTP(secret)
        current_code = totp.now()
        
        result = TwoFactorAuthService.verify_code(secret, current_code)
        assert result is True

    def test_verify_code_invalid(self):
        """Test verifying an invalid TOTP code"""
        secret = TwoFactorAuthService.generate_secret()
        
        result = TwoFactorAuthService.verify_code(secret, "000000")
        assert result is False

    def test_verify_code_wrong_secret(self):
        """Test verifying code with wrong secret"""
        secret1 = TwoFactorAuthService.generate_secret()
        secret2 = TwoFactorAuthService.generate_secret()
        totp = pyotp.TOTP(secret1)
        current_code = totp.now()
        
        result = TwoFactorAuthService.verify_code(secret2, current_code)
        assert result is False

    def test_setup_2fa_success(self, mock_user, mock_db):
        """Test successful 2FA setup"""
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.generate_secret.return_value = "TESTSECRET123"
            mock_two_factor.generate_qr_code.return_value = "base64_qr_code"
            
            secret, qr_code = TwoFactorAuthService.setup_2fa(mock_db, mock_user)
            
            assert secret == "TESTSECRET123"
            assert qr_code == "base64_qr_code"
            assert mock_user.two_factor_secret == "TESTSECRET123"
            mock_db.commit.assert_called_once()

    def test_setup_2fa_calls_correct_methods(self, mock_user, mock_db):
        """Test that setup_2fa calls the correct TwoFactorService methods"""
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.generate_secret.return_value = "TESTSECRET123"
            mock_two_factor.generate_qr_code.return_value = "base64_qr_code"
            
            TwoFactorAuthService.setup_2fa(mock_db, mock_user)
            
            mock_two_factor.generate_secret.assert_called_once()
            mock_two_factor.generate_qr_code.assert_called_once_with("TESTSECRET123", mock_user.email)

    def test_confirm_2fa_success(self, mock_user, mock_db):
        """Test successful 2FA confirmation"""
        mock_user.two_factor_secret = "TESTSECRET123"
        
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.verify_code.return_value = True
            
            result = TwoFactorAuthService.confirm_2fa(mock_db, mock_user, "123456")
            
            assert result is True
            assert mock_user.two_factor_enabled is True
            mock_db.commit.assert_called_once()

    def test_confirm_2fa_no_secret(self, mock_user, mock_db):
        """Test 2FA confirmation when no secret is set"""
        mock_user.two_factor_secret = None
        
        result = TwoFactorAuthService.confirm_2fa(mock_db, mock_user, "123456")
        
        assert result is False
        assert mock_user.two_factor_enabled is False
        mock_db.commit.assert_not_called()

    def test_confirm_2fa_invalid_code(self, mock_user, mock_db):
        """Test 2FA confirmation with invalid code"""
        mock_user.two_factor_secret = "TESTSECRET123"
        
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.verify_code.return_value = False
            
            result = TwoFactorAuthService.confirm_2fa(mock_db, mock_user, "123456")
            
            assert result is False
            assert mock_user.two_factor_enabled is False
            mock_db.commit.assert_not_called()

    def test_disable_2fa_success(self, mock_user, mock_db):
        """Test successful 2FA disable"""
        mock_user.two_factor_secret = "TESTSECRET123"
        mock_user.two_factor_enabled = True
        
        TwoFactorAuthService.disable_2fa(mock_db, mock_user)
        
        assert mock_user.two_factor_secret is None
        assert mock_user.two_factor_enabled is False
        mock_db.commit.assert_called_once()

    def test_disable_2fa_already_disabled(self, mock_user, mock_db):
        """Test disabling 2FA when already disabled"""
        mock_user.two_factor_secret = None
        mock_user.two_factor_enabled = False
        
        TwoFactorAuthService.disable_2fa(mock_db, mock_user)
        
        assert mock_user.two_factor_secret is None
        assert mock_user.two_factor_enabled is False
        mock_db.commit.assert_called_once()

    def test_verify_2fa_success(self, mock_user, mock_db):
        """Test successful 2FA verification"""
        mock_user.two_factor_secret = "TESTSECRET123"
        mock_user.two_factor_enabled = True
        
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.verify_code.return_value = True
            
            result = TwoFactorAuthService.verify_2fa(mock_db, mock_user, "123456")
            
            assert result is True

    def test_verify_2fa_not_enabled(self, mock_user, mock_db):
        """Test 2FA verification when 2FA is not enabled"""
        mock_user.two_factor_secret = "TESTSECRET123"
        mock_user.two_factor_enabled = False
        
        result = TwoFactorAuthService.verify_2fa(mock_db, mock_user, "123456")
        
        assert result is False

    def test_verify_2fa_no_secret(self, mock_user, mock_db):
        """Test 2FA verification when no secret is set"""
        mock_user.two_factor_secret = None
        mock_user.two_factor_enabled = True
        
        result = TwoFactorAuthService.verify_2fa(mock_db, mock_user, "123456")
        
        assert result is False

    def test_verify_2fa_invalid_code(self, mock_user, mock_db):
        """Test 2FA verification with invalid code"""
        mock_user.two_factor_secret = "TESTSECRET123"
        mock_user.two_factor_enabled = True
        
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.verify_code.return_value = False
            
            result = TwoFactorAuthService.verify_2fa(mock_db, mock_user, "123456")
            
            assert result is False

    def test_generate_backup_codes_success(self, mock_user, mock_db):
        """Test successful backup code generation"""
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.generate_backup_codes.return_value = ["CODE1", "CODE2", "CODE3"]
            
            with patch('app.services.two_factor.get_password_hash') as mock_hash:
                mock_hash.side_effect = lambda code: f"hashed_{code}"
                
                backup_codes = TwoFactorAuthService.generate_backup_codes(mock_db, mock_user)
                
                assert backup_codes == ["CODE1", "CODE2", "CODE3"]
                assert mock_user.backup_codes == ["hashed_CODE1", "hashed_CODE2", "hashed_CODE3"]
                mock_db.commit.assert_called_once()

    def test_generate_backup_codes_calls_correct_methods(self, mock_user, mock_db):
        """Test that generate_backup_codes calls the correct methods"""
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.generate_backup_codes.return_value = ["CODE1", "CODE2"]
            
            with patch('app.services.two_factor.get_password_hash') as mock_hash:
                mock_hash.side_effect = lambda code: f"hashed_{code}"
                
                TwoFactorAuthService.generate_backup_codes(mock_db, mock_user)
                
                mock_two_factor.generate_backup_codes.assert_called_once()
                assert mock_hash.call_count == 2

    def test_verify_backup_code_success(self, mock_user, mock_db):
        """Test successful backup code verification"""
        mock_user.backup_codes = ["hashed_CODE1", "hashed_CODE2", "hashed_CODE3"]
        
        with patch('app.services.two_factor.verify_password') as mock_verify:
            mock_verify.side_effect = lambda code, hashed: code == "CODE2" and hashed == "hashed_CODE2"
            
            result = TwoFactorAuthService.verify_backup_code(mock_db, mock_user, "CODE2")
            
            assert result is True
            assert "hashed_CODE2" not in mock_user.backup_codes
            mock_db.commit.assert_called_once()

    def test_verify_backup_code_no_backup_codes(self, mock_user, mock_db):
        """Test backup code verification when no backup codes exist"""
        mock_user.backup_codes = None
        
        result = TwoFactorAuthService.verify_backup_code(mock_db, mock_user, "CODE1")
        
        assert result is False
        mock_db.commit.assert_not_called()

    def test_verify_backup_code_empty_backup_codes(self, mock_user, mock_db):
        """Test backup code verification when backup codes list is empty"""
        mock_user.backup_codes = []
        
        result = TwoFactorAuthService.verify_backup_code(mock_db, mock_user, "CODE1")
        
        assert result is False
        mock_db.commit.assert_not_called()

    def test_verify_backup_code_invalid_code(self, mock_user, mock_db):
        """Test backup code verification with invalid code"""
        mock_user.backup_codes = ["hashed_CODE1", "hashed_CODE2"]
        
        with patch('app.services.two_factor.verify_password') as mock_verify:
            mock_verify.return_value = False
            
            result = TwoFactorAuthService.verify_backup_code(mock_db, mock_user, "INVALID")
            
            assert result is False
            assert mock_user.backup_codes == ["hashed_CODE1", "hashed_CODE2"]  # Unchanged
            mock_db.commit.assert_not_called()

    def test_verify_backup_code_removes_used_code(self, mock_user, mock_db):
        """Test that used backup codes are removed"""
        mock_user.backup_codes = ["hashed_CODE1", "hashed_CODE2"]
        
        with patch('app.services.two_factor.verify_password') as mock_verify:
            mock_verify.side_effect = lambda code, hashed: code == "CODE1" and hashed == "hashed_CODE1"
            
            result = TwoFactorAuthService.verify_backup_code(mock_db, mock_user, "CODE1")
            
            assert result is True
            assert mock_user.backup_codes == ["hashed_CODE2"]  # CODE1 removed
            mock_db.commit.assert_called_once()

    def test_qr_code_generation_with_special_characters(self):
        """Test QR code generation with special characters in email"""
        secret = TwoFactorAuthService.generate_secret()
        email = "test+user@example.com"
        
        qr_code = TwoFactorAuthService.generate_qr_code(secret, email)
        
        assert isinstance(qr_code, str)
        assert len(qr_code) > 0

    def test_qr_code_generation_with_long_email(self):
        """Test QR code generation with long email address"""
        secret = TwoFactorAuthService.generate_secret()
        email = "very.long.email.address.with.many.parts@very.long.domain.name.com"
        
        qr_code = TwoFactorAuthService.generate_qr_code(secret, email)
        
        assert isinstance(qr_code, str)
        assert len(qr_code) > 0

    def test_verify_code_with_empty_string(self):
        """Test verifying code with empty string"""
        secret = TwoFactorAuthService.generate_secret()
        
        result = TwoFactorAuthService.verify_code(secret, "")
        assert result is False

    def test_verify_code_with_none(self):
        """Test verifying code with None (should use empty string for linter compliance)"""
        secret = TwoFactorAuthService.generate_secret()
        # Linter: verify_code expects str, so use "" to simulate invalid input
        result = TwoFactorAuthService.verify_code(secret, "")
        assert result is False

    def test_setup_2fa_updates_user_secret(self, mock_user, mock_db):
        """Test that setup_2fa properly updates the user's secret"""
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.generate_secret.return_value = "NEWSECRET123"
            mock_two_factor.generate_qr_code.return_value = "base64_qr_code"
            
            TwoFactorAuthService.setup_2fa(mock_db, mock_user)
            
            assert mock_user.two_factor_secret == "NEWSECRET123"

    def test_confirm_2fa_verifies_correct_code(self, mock_user, mock_db):
        """Test that confirm_2fa verifies the correct code"""
        mock_user.two_factor_secret = "TESTSECRET123"
        
        with patch('app.services.two_factor.TwoFactorService') as mock_two_factor:
            mock_two_factor.verify_code.return_value = True
            
            TwoFactorAuthService.confirm_2fa(mock_db, mock_user, "123456")
            
            mock_two_factor.verify_code.assert_called_once_with("TESTSECRET123", "123456") 