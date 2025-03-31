import { useCallback, useRef, useEffect } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';
import { useErrorTracking } from './useErrorTracking';
import { DataValidator } from '../utils/dataValidation';

interface MigrationStep {
  version: number;
  migrate: (data: any) => any;
  validate?: (data: any) => boolean;
}

interface MigrationOptions {
  type: string;
  currentVersion: number;
  storageKey: string;
  steps: MigrationStep[];
  onMigrationStart?: () => void;
  onMigrationComplete?: (newVersion: number) => void;
  onMigrationError?: (error: Error) => void;
}

export const useDataMigration = (options: MigrationOptions) => {
  const {
    type,
    currentVersion,
    storageKey,
    steps,
    onMigrationStart,
    onMigrationComplete,
    onMigrationError,
  } = options;

  const { trackError } = useErrorTracking();
  usePerformanceMonitoring('DataMigration');

  const validator = useRef(DataValidator.getInstance());
  const migrationInProgress = useRef(false);

  // Sort migration steps by version
  const sortedSteps = useRef(
    [...steps].sort((a, b) => a.version - b.version)
  );

  // Check if migration is needed
  const needsMigration = useCallback((data: any): boolean => {
    return data && data.version < currentVersion;
  }, [currentVersion]);

  // Get current data version
  const getCurrentDataVersion = useCallback((data: any): number => {
    return data?.version || 0;
  }, []);

  // Apply migration steps
  const applyMigration = useCallback(
    async (data: any): Promise<any> => {
      const currentVersion = getCurrentDataVersion(data);
      const stepsToApply = sortedSteps.current.filter(
        step => step.version > currentVersion
      );

      if (stepsToApply.length === 0) {
        return data;
      }

      let migratedData = { ...data };

      for (const step of stepsToApply) {
        try {
          // Apply migration
          migratedData = step.migrate(migratedData);

          // Validate migrated data if validation function is provided
          if (step.validate && !step.validate(migratedData)) {
            throw new Error(`Validation failed for migration step ${step.version}`);
          }

          // Update version
          migratedData.version = step.version;

          // Save intermediate state
          localStorage.setItem(storageKey, JSON.stringify(migratedData));
        } catch (error) {
          trackError('Migration step failed', {
            error,
            context: 'DataMigration',
            type,
            step: step.version,
          });
          throw error;
        }
      }

      return migratedData;
    },
    [getCurrentDataVersion, storageKey, type, trackError]
  );

  // Run migration
  const runMigration = useCallback(async () => {
    if (migrationInProgress.current) {
      return;
    }

    migrationInProgress.current = true;
    onMigrationStart?.();

    try {
      // Get current data
      const currentData = localStorage.getItem(storageKey);
      if (!currentData) {
        throw new Error('No data found to migrate');
      }

      const data = JSON.parse(currentData);

      // Check if migration is needed
      if (!needsMigration(data)) {
        migrationInProgress.current = false;
        return;
      }

      // Apply migrations
      const migratedData = await applyMigration(data);

      // Validate final data
      const validationResult = validator.current.validate(type, migratedData);
      if (!validationResult.success) {
        throw new Error(validationResult.error);
      }

      // Save migrated data
      localStorage.setItem(storageKey, JSON.stringify(migratedData));

      onMigrationComplete?.(migratedData.version);
    } catch (error) {
      trackError('Migration failed', {
        error,
        context: 'DataMigration',
        type,
      });
      onMigrationError?.(error as Error);
    } finally {
      migrationInProgress.current = false;
    }
  }, [
    needsMigration,
    applyMigration,
    storageKey,
    type,
    onMigrationStart,
    onMigrationComplete,
    onMigrationError,
    trackError,
  ]);

  // Run migration on mount if needed
  useEffect(() => {
    runMigration();
  }, [runMigration]);

  // Rollback to specific version
  const rollback = useCallback(
    async (targetVersion: number) => {
      if (migrationInProgress.current) {
        return;
      }

      migrationInProgress.current = true;
      onMigrationStart?.();

      try {
        // Get current data
        const currentData = localStorage.getItem(storageKey);
        if (!currentData) {
          throw new Error('No data found to rollback');
        }

        const data = JSON.parse(currentData);
        const currentVersion = getCurrentDataVersion(data);

        if (currentVersion <= targetVersion) {
          migrationInProgress.current = false;
          return;
        }

        // Find the step that matches the target version
        const targetStep = sortedSteps.current.find(
          step => step.version === targetVersion
        );

        if (!targetStep) {
          throw new Error(`No migration step found for version ${targetVersion}`);
        }

        // Apply the target step
        const rolledBackData = targetStep.migrate(data);
        rolledBackData.version = targetVersion;

        // Validate rolled back data
        const validationResult = validator.current.validate(type, rolledBackData);
        if (!validationResult.success) {
          throw new Error(validationResult.error);
        }

        // Save rolled back data
        localStorage.setItem(storageKey, JSON.stringify(rolledBackData));

        onMigrationComplete?.(targetVersion);
      } catch (error) {
        trackError('Rollback failed', {
          error,
          context: 'DataMigration',
          type,
          targetVersion,
        });
        onMigrationError?.(error as Error);
      } finally {
        migrationInProgress.current = false;
      }
    },
    [getCurrentDataVersion, storageKey, type, onMigrationStart, onMigrationComplete, onMigrationError, trackError]
  );

  return {
    runMigration,
    rollback,
    isMigrating: migrationInProgress.current,
  };
};

// Example usage:
/*
const UserPreferences: React.FC = () => {
  const migrationSteps: MigrationStep[] = [
    {
      version: 1,
      migrate: (data) => ({
        ...data,
        theme: data.theme || 'light',
        fontSize: data.fontSize || 16,
        notifications: data.notifications || {
          email: true,
          push: true,
          desktop: true,
        },
      }),
      validate: (data) => {
        return (
          data.theme &&
          typeof data.fontSize === 'number' &&
          data.notifications &&
          typeof data.notifications.email === 'boolean'
        );
      },
    },
    {
      version: 2,
      migrate: (data) => ({
        ...data,
        language: data.language || 'en',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
      validate: (data) => {
        return data.language && data.timezone;
      },
    },
  ];

  const {
    runMigration,
    rollback,
    isMigrating,
  } = useDataMigration({
    type: 'userPreferences',
    currentVersion: 2,
    storageKey: 'user-preferences',
    steps: migrationSteps,
    onMigrationStart: () => {
      console.log('Starting migration...');
    },
    onMigrationComplete: (newVersion) => {
      console.log(`Migration completed to version ${newVersion}`);
    },
    onMigrationError: (error) => {
      console.error('Migration failed:', error);
    },
  });

  const handleRollback = async () => {
    await rollback(1);
  };

  return (
    <div>
      <h2>User Preferences</h2>
      {isMigrating && <div>Migrating data...</div>}
      <button onClick={handleRollback}>Rollback to Version 1</button>
      {/* Rest of the component */}
    </div>
  );
};
*/ 