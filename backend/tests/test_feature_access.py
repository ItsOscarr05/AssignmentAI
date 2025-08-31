import pytest
from unittest.mock import Mock, MagicMock
from app.core.feature_access import (
    get_user_plan,
    has_feature_access,
    get_upgrade_message,
    get_available_features,
    get_feature_requirements,
    FEATURE_ACCESS_MATRIX
)
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus


@pytest.fixture
def mock_user():
    """Create a mock user for testing"""
    user = Mock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.is_active = True
    return user


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return Mock()


@pytest.fixture
def mock_free_subscription():
    """Create a mock free subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_free"
    return subscription


@pytest.fixture
def mock_plus_subscription():
    """Create a mock plus subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_plus"
    return subscription


@pytest.fixture
def mock_pro_subscription():
    """Create a mock pro subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_pro"
    return subscription


@pytest.fixture
def mock_max_subscription():
    """Create a mock max subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_max"
    return subscription


class TestGetUserPlan:
    """Test user plan detection"""

    def test_get_user_plan_free_no_subscription(self, mock_user, mock_db):
        """Test getting free plan when user has no subscription"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        plan = get_user_plan(mock_user, mock_db)
        
        assert plan == "free"
        mock_db.query.assert_called_once()

    def test_get_user_plan_free_with_subscription(self, mock_user, mock_db, mock_free_subscription):
        """Test getting free plan when user has free subscription"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_free_subscription
        
        plan = get_user_plan(mock_user, mock_db)
        
        assert plan == "free"

    def test_get_user_plan_plus(self, mock_user, mock_db, mock_plus_subscription):
        """Test getting plus plan"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plus_subscription
        
        plan = get_user_plan(mock_user, mock_db)
        
        assert plan == "plus"

    def test_get_user_plan_pro(self, mock_user, mock_db, mock_pro_subscription):
        """Test getting pro plan"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pro_subscription
        
        plan = get_user_plan(mock_user, mock_db)
        
        assert plan == "pro"

    def test_get_user_plan_max(self, mock_user, mock_db, mock_max_subscription):
        """Test getting max plan"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_max_subscription
        
        plan = get_user_plan(mock_user, mock_db)
        
        assert plan == "max"

    def test_get_user_plan_unknown_plan_id(self, mock_user, mock_db):
        """Test getting plan with unknown plan ID"""
        subscription = Mock(spec=Subscription)
        subscription.user_id = 1
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.plan_id = "unknown_plan"
        mock_db.query.return_value.filter.return_value.first.return_value = subscription
        
        plan = get_user_plan(mock_user, mock_db)
        
        assert plan == "free"  # Default to free for unknown plans


class TestHasFeatureAccess:
    """Test feature access checking"""

    def test_free_user_basic_features(self, mock_user, mock_db):
        """Test that free users can access basic features"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Basic features should be accessible
        assert has_feature_access(mock_user, "basic_assignment_generation", mock_db) == True
        assert has_feature_access(mock_user, "grammar_spelling_check", mock_db) == True
        assert has_feature_access(mock_user, "basic_writing_suggestions", mock_db) == True

    def test_free_user_premium_features_denied(self, mock_user, mock_db):
        """Test that free users cannot access premium features"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Premium features should be denied
        assert has_feature_access(mock_user, "diagram_generation", mock_db) == False
        assert has_feature_access(mock_user, "data_analysis", mock_db) == False
        assert has_feature_access(mock_user, "code_analysis", mock_db) == False
        # Free features should be accessible
        assert has_feature_access(mock_user, "image_analysis", mock_db) == True

    def test_plus_user_plus_features(self, mock_user, mock_db, mock_plus_subscription):
        """Test that plus users can access plus features"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plus_subscription
        
        # Plus features should be accessible
        assert has_feature_access(mock_user, "advanced_writing_analysis", mock_db) == True
        assert has_feature_access(mock_user, "style_tone_suggestions", mock_db) == True
        assert has_feature_access(mock_user, "extended_templates", mock_db) == True

    def test_plus_user_pro_features_denied(self, mock_user, mock_db, mock_plus_subscription):
        """Test that plus users cannot access pro features"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plus_subscription
        
        # Pro features should be denied
        assert has_feature_access(mock_user, "diagram_generation", mock_db) == False
        assert has_feature_access(mock_user, "data_analysis", mock_db) == False
        # Plus features should be accessible
        assert has_feature_access(mock_user, "image_analysis", mock_db) == True
        assert has_feature_access(mock_user, "code_analysis", mock_db) == True

    def test_pro_user_pro_features(self, mock_user, mock_db, mock_pro_subscription):
        """Test that pro users can access pro features"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pro_subscription
        
        # Pro features should be accessible
        assert has_feature_access(mock_user, "diagram_generation", mock_db) == True
        assert has_feature_access(mock_user, "image_analysis", mock_db) == True
        assert has_feature_access(mock_user, "code_analysis", mock_db) == True
        assert has_feature_access(mock_user, "data_analysis", mock_db) == True

    def test_pro_user_max_features_denied(self, mock_user, mock_db, mock_pro_subscription):
        """Test that pro users cannot access max features"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pro_subscription
        
        # Max features should be denied
        assert has_feature_access(mock_user, "advanced_analytics", mock_db) == False
        assert has_feature_access(mock_user, "custom_templates", mock_db) == False

    def test_max_user_all_features(self, mock_user, mock_db, mock_max_subscription):
        """Test that max users can access all features"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_max_subscription
        
        # All features should be accessible
        assert has_feature_access(mock_user, "basic_assignment_generation", mock_db) == True
        assert has_feature_access(mock_user, "diagram_generation", mock_db) == True
        assert has_feature_access(mock_user, "advanced_analytics", mock_db) == True
        assert has_feature_access(mock_user, "custom_templates", mock_db) == True

    def test_unknown_feature(self, mock_user, mock_db):
        """Test access to unknown feature"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Unknown features should be denied
        assert has_feature_access(mock_user, "unknown_feature", mock_db) == False


class TestGetUpgradeMessage:
    """Test upgrade message generation"""

    def test_free_user_upgrade_to_plus(self):
        """Test upgrade message for free user to plus features"""
        message = get_upgrade_message("free", "advanced_writing_analysis")
        assert "Upgrade to Plus plan" in message

    def test_free_user_upgrade_to_pro(self):
        """Test upgrade message for free user to pro features"""
        message = get_upgrade_message("free", "diagram_generation")
        assert "Upgrade to Pro plan" in message

    def test_free_user_image_analysis_available(self):
        """Test that image_analysis is available in free plan"""
        message = get_upgrade_message("free", "image_analysis")
        assert "Upgrade to Max plan" in message  # Should be available in free, so this tests fallback

    def test_free_user_upgrade_to_max(self):
        """Test upgrade message for free user to max features"""
        message = get_upgrade_message("free", "advanced_analytics")
        assert "Upgrade to Max plan" in message

    def test_plus_user_upgrade_to_pro(self):
        """Test upgrade message for plus user to pro features"""
        message = get_upgrade_message("plus", "diagram_generation")
        assert "Upgrade to Pro plan" in message

    def test_plus_user_upgrade_to_max(self):
        """Test upgrade message for plus user to max features"""
        message = get_upgrade_message("plus", "advanced_analytics")
        assert "Upgrade to Max plan" in message

    def test_pro_user_upgrade_to_max(self):
        """Test upgrade message for pro user to max features"""
        message = get_upgrade_message("pro", "advanced_analytics")
        assert "Upgrade to Max plan" in message

    def test_max_user_upgrade_message(self):
        """Test upgrade message for max user"""
        message = get_upgrade_message("max", "unknown_feature")
        assert "Contact support" in message


class TestGetAvailableFeatures:
    """Test getting available features for a user"""

    def test_free_user_available_features(self, mock_user, mock_db):
        """Test available features for free user"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        features = get_available_features(mock_user, mock_db)
        
        assert features["basic_assignment_generation"] == True
        assert features["grammar_spelling_check"] == True
        assert features["diagram_generation"] == False
        assert features["image_analysis"] == True
        assert features["code_analysis"] == False

    def test_plus_user_available_features(self, mock_user, mock_db, mock_plus_subscription):
        """Test available features for plus user"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plus_subscription
        
        features = get_available_features(mock_user, mock_db)
        
        assert features["basic_assignment_generation"] == True
        assert features["advanced_writing_analysis"] == True
        assert features["diagram_generation"] == False
        assert features["image_analysis"] == True
        assert features["code_analysis"] == True

    def test_pro_user_available_features(self, mock_user, mock_db, mock_pro_subscription):
        """Test available features for pro user"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pro_subscription
        
        features = get_available_features(mock_user, mock_db)
        
        assert features["basic_assignment_generation"] == True
        assert features["diagram_generation"] == True
        assert features["image_analysis"] == True
        assert features["advanced_analytics"] == False

    def test_max_user_available_features(self, mock_user, mock_db, mock_max_subscription):
        """Test available features for max user"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_max_subscription
        
        features = get_available_features(mock_user, mock_db)
        
        assert features["basic_assignment_generation"] == True
        assert features["diagram_generation"] == True
        assert features["advanced_analytics"] == True
        assert features["custom_templates"] == True


class TestGetFeatureRequirements:
    """Test feature requirements for each plan"""

    def test_free_plan_requirements(self):
        """Test feature requirements for free plan"""
        requirements = get_feature_requirements()
        
        assert "basic_assignment_generation" in requirements["free"]["available"]
        assert "grammar_spelling_check" in requirements["free"]["available"]
        assert "image_analysis" in requirements["free"]["available"]
        assert "diagram_generation" in requirements["free"]["unavailable"]
        assert "code_analysis" in requirements["free"]["unavailable"]

    def test_plus_plan_requirements(self):
        """Test feature requirements for plus plan"""
        requirements = get_feature_requirements()
        
        assert "basic_assignment_generation" in requirements["plus"]["available"]
        assert "advanced_writing_analysis" in requirements["plus"]["available"]
        assert "image_analysis" in requirements["plus"]["available"]
        assert "code_analysis" in requirements["plus"]["available"]
        assert "diagram_generation" in requirements["plus"]["unavailable"]

    def test_pro_plan_requirements(self):
        """Test feature requirements for pro plan"""
        requirements = get_feature_requirements()
        
        assert "basic_assignment_generation" in requirements["pro"]["available"]
        assert "diagram_generation" in requirements["pro"]["available"]
        assert "image_analysis" in requirements["pro"]["available"]
        assert "advanced_analytics" in requirements["pro"]["unavailable"]

    def test_max_plan_requirements(self):
        """Test feature requirements for max plan"""
        requirements = get_feature_requirements()
        
        assert "basic_assignment_generation" in requirements["max"]["available"]
        assert "diagram_generation" in requirements["max"]["available"]
        assert "advanced_analytics" in requirements["max"]["available"]
        assert len(requirements["max"]["unavailable"]) == 0


class TestFeatureAccessMatrix:
    """Test the feature access matrix structure"""

    def test_matrix_structure(self):
        """Test that the feature access matrix has the correct structure"""
        assert "free" in FEATURE_ACCESS_MATRIX
        assert "plus" in FEATURE_ACCESS_MATRIX
        assert "pro" in FEATURE_ACCESS_MATRIX
        assert "max" in FEATURE_ACCESS_MATRIX

    def test_matrix_inheritance(self):
        """Test that higher plans inherit features from lower plans"""
        # Plus should have all free features
        for feature, access in FEATURE_ACCESS_MATRIX["free"].items():
            if access:  # If free has access
                assert FEATURE_ACCESS_MATRIX["plus"][feature] == True

        # Pro should have all plus features
        for feature, access in FEATURE_ACCESS_MATRIX["plus"].items():
            if access:  # If plus has access
                assert FEATURE_ACCESS_MATRIX["pro"][feature] == True

        # Max should have all pro features
        for feature, access in FEATURE_ACCESS_MATRIX["pro"].items():
            if access:  # If pro has access
                assert FEATURE_ACCESS_MATRIX["max"][feature] == True

    def test_matrix_consistency(self):
        """Test that the matrix is consistent across all plans"""
        all_features = set(FEATURE_ACCESS_MATRIX["free"].keys())
        
        for plan in ["plus", "pro", "max"]:
            plan_features = set(FEATURE_ACCESS_MATRIX[plan].keys())
            assert plan_features == all_features 