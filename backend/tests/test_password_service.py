import pytest
import hashlib
from unittest.mock import patch, Mock
from app.services.password_service import PasswordService, password_service


class TestPasswordService:
    def setup_method(self):
        self.service = PasswordService()

    def test_check_password_strength_valid_password(self):
        """Test password strength check with valid password"""
        password = "StrongPass123!"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is True
        assert message == "Password meets requirements"

    def test_check_password_strength_too_short(self):
        """Test password strength check with too short password"""
        password = "Short1!"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False
        assert "at least 12 characters" in message

    def test_check_password_strength_no_uppercase(self):
        """Test password strength check without uppercase"""
        password = "strongpass123!"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False
        assert "uppercase letter" in message

    def test_check_password_strength_no_lowercase(self):
        """Test password strength check without lowercase"""
        password = "STRONGPASS123!"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False
        assert "lowercase letter" in message

    def test_check_password_strength_no_numbers(self):
        """Test password strength check without numbers"""
        password = "StrongPass!"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False
        # If password is too short, the message will be about length, not numbers
        if len(password) < self.service.min_length:
            assert "at least 12 characters" in message
        else:
            assert "number" in message

    def test_check_password_strength_no_numbers_long_enough(self):
        """Test password strength check without numbers but long enough"""
        password = "StrongPassword!"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False
        assert "number" in message

    def test_check_password_strength_no_special_chars(self):
        """Test password strength check without special characters"""
        password = "StrongPass123"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False
        assert "special character" in message

    def test_check_password_strength_multiple_violations(self):
        """Test password strength check with multiple violations"""
        password = "weak"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False
        # Should return the first violation found
        assert "at least 12 characters" in message

    @pytest.mark.asyncio
    @patch('app.services.password_service.requests.get')
    async def test_check_password_breach_safe_password(self, mock_get):
        """Test password breach check with safe password"""
        # Mock successful response with no matches
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "ABCDE1234567890ABCDEF1234567890ABCDEF:1\nFEDCBA1234567890FEDCBA1234567890FEDCBA:5"
        mock_get.return_value = mock_response

        password = "MySecurePassword123!"
        is_safe, message = await self.service.check_password_breach(password)
        
        assert is_safe is True
        assert message is not None and "has not been exposed" in message

    @pytest.mark.asyncio
    @patch('app.services.password_service.requests.get')
    async def test_check_password_breach_compromised_password(self, mock_get):
        """Test password breach check with compromised password"""
        # Generate hash for a test password
        test_password = "password123"
        sha1_hash = hashlib.sha1(test_password.encode()).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]
        
        # Mock response with the compromised hash
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = f"{suffix}:12345\nABCDE1234567890ABCDEF1234567890ABCDEF:1"
        mock_get.return_value = mock_response

        is_safe, message = await self.service.check_password_breach(test_password)
        
        assert is_safe is False
        assert message is not None and "has been exposed in 12345 data breaches" in message

    @pytest.mark.asyncio
    @patch('app.services.password_service.requests.get')
    async def test_check_password_breach_api_error(self, mock_get):
        """Test password breach check with API error"""
        mock_get.side_effect = Exception("API Error")

        password = "MySecurePassword123!"
        is_safe, message = await self.service.check_password_breach(password)
        
        assert is_safe is True
        assert message is not None and "Unable to check password breach status" in message

    @pytest.mark.asyncio
    @patch('app.services.password_service.requests.get')
    async def test_check_password_breach_non_200_response(self, mock_get):
        """Test password breach check with non-200 response"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        password = "MySecurePassword123!"
        is_safe, message = await self.service.check_password_breach(password)
        
        assert is_safe is True
        assert message is not None and "has not been exposed" in message

    def test_calculate_password_strength_score_weak(self):
        """Test password strength score calculation for weak password"""
        password = "weak"
        score = self.service.calculate_password_strength_score(password)
        assert score == 2  # lowercase + length (if >= 12)

    def test_calculate_password_strength_score_medium(self):
        """Test password strength score calculation for medium password"""
        password = "MediumPass123"
        score = self.service.calculate_password_strength_score(password)
        assert score == 4  # Length, uppercase, lowercase, numbers

    def test_calculate_password_strength_score_strong(self):
        """Test password strength score calculation for strong password"""
        password = "StrongPass123!"
        score = self.service.calculate_password_strength_score(password)
        assert score == 4  # All criteria met

    def test_calculate_password_strength_score_with_complexity(self):
        """Test password strength score with high complexity"""
        password = "Complex!@#$%^&*()"
        score = self.service.calculate_password_strength_score(password)
        # Should be 4 (capped at 4)
        assert score == 4

    def test_calculate_password_strength_score_length_only(self):
        """Test password strength score with only length requirement met"""
        password = "verylongpasswordwithoutotherrequirements"
        score = self.service.calculate_password_strength_score(password)
        assert score == 2  # Length + lowercase

    def test_calculate_password_strength_score_uppercase_only(self):
        """Test password strength score with only uppercase"""
        password = "UPPERCASE"
        score = self.service.calculate_password_strength_score(password)
        assert score == 2  # Uppercase + length (if >= 12)

    def test_calculate_password_strength_score_lowercase_only(self):
        """Test password strength score with only lowercase"""
        password = "lowercase"
        score = self.service.calculate_password_strength_score(password)
        assert score == 2  # Lowercase + length (if >= 12)

    def test_calculate_password_strength_score_numbers_only(self):
        """Test password strength score with only numbers"""
        password = "123456789012"
        score = self.service.calculate_password_strength_score(password)
        assert score == 3  # Length, numbers, and complexity

    def test_calculate_password_strength_score_special_only(self):
        """Test password strength score with only special characters"""
        password = "!@#$%^&*()"
        score = self.service.calculate_password_strength_score(password)
        assert score == 2  # Special characters + length (if >= 12)

    def test_service_initialization(self):
        """Test password service initialization"""
        service = PasswordService()
        assert service.min_length == 12
        assert service.require_uppercase is True
        assert service.require_lowercase is True
        assert service.require_numbers is True
        assert service.require_special is True
        assert hasattr(service, 'haveibeenpwned_api_key')

    def test_global_password_service_instance(self):
        """Test global password service instance"""
        assert isinstance(password_service, PasswordService)
        assert password_service.min_length == 12

    def test_password_strength_edge_cases(self):
        """Test password strength with edge cases"""
        # Empty password
        is_valid, message = self.service.check_password_strength("")
        assert is_valid is False
        assert "at least 12 characters" in message

        # Password with exactly minimum length
        password = "StrongPass1!"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is True

        # Password with all special characters
        password = "!@#$%^&*()_+{}|:<>?[]\\;'\",./"
        is_valid, message = self.service.check_password_strength(password)
        assert is_valid is False  # Missing uppercase, lowercase, numbers

    def test_password_strength_score_edge_cases(self):
        """Test password strength score with edge cases"""
        # Empty password
        score = self.service.calculate_password_strength_score("")
        assert score == 0

        # Single character
        score = self.service.calculate_password_strength_score("a")
        assert score == 2  # Lowercase + complexity

        # Very long password with repetition
        password = "a" * 50
        score = self.service.calculate_password_strength_score(password)
        assert score == 2  # Length + lowercase

        # Password with high complexity (many unique characters)
        password = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()"
        score = self.service.calculate_password_strength_score(password)
        assert score == 4  # All criteria met, capped at 4 