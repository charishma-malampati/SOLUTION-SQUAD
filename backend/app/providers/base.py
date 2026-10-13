from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseSocialDataProvider(ABC):
    """
    Abstract interface for authorized social media platform API integrations
    (e.g., Meta Graph API, X API v2, LinkedIn Marketing API, YouTube Data API).
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the unique name of the data provider."""
        pass

    @abstractmethod
    def search_profiles(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Queries the platform API for profiles matching query.
        Must return normalized dictionary records conforming to SocialProfileRecord schema.
        """
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Checks if required API keys / OAuth credentials are validly supplied."""
        pass


class BaseAppStoreDataProvider(ABC):
    """
    Abstract interface for authorized mobile app store integrations
    (e.g., Google Play Developer API, Apple App Store Server API, AppBrain/Data.ai adapters).
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns provider identifier."""
        pass

    @abstractmethod
    def search_app_listings(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Queries app store catalogs for apps matching brand keywords.
        Returns normalized dictionary records conforming to AppListingRecord schema.
        """
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Checks if store credentials/tokens are active."""
        pass


class SyntheticLocalDataProvider(BaseSocialDataProvider, BaseAppStoreDataProvider):
    """
    Default deterministic offline data provider for hackathon demonstrations,
    synthetic datasets, and user-provided CSV ingestion.
    """

    def get_provider_name(self) -> str:
        return "synthetic_offline_engine"

    def search_profiles(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        # In offline/hackathon mode, returns loaded database records
        return []

    def search_app_listings(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        return []

    def is_configured(self) -> bool:
        return True
