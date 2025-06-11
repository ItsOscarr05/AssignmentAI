import { useCallback, useEffect, useRef } from 'react';
import { DataValidator } from '../utils/dataValidation';
import { usePerformanceMonitoring } from '../utils/performance';
import { useErrorTracking } from './useErrorTracking';

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
  const sortedSteps = useRef([...steps].sort((a, b) => a.version - b.version));

  // Check if migration is needed
  const needsMigration = useCallback(
    (data: any): boolean => {
      return data && data.version < currentVersion;
    },
    [currentVersion]
  );

  // Get current data version
  const getCurrentDataVersion = useCallback((data: any): number => {
    return data?.version || 0;
  }, []);

  // Apply migration steps
  const applyMigration = useCallback(
    async (data: any): Promise<any> => {
      const currentVersion = getCurrentDataVersion(data);
      const stepsToApply = sortedSteps.current.filter(step => step.version > currentVersion);

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
            const error = new Error(`Validation failed for migration step ${step.version}`);
            trackError(
              new ErrorEvent('error', { error }),
              `context=DataMigration,type=${type},step=${step.version}`
            );
            throw error;
          }

          // Update version
          migratedData.version = step.version;

          // Save intermediate state
          localStorage.setItem(storageKey, JSON.stringify(migratedData));
        } catch (error) {
          trackError(
            new ErrorEvent('error', { error }),
            `context=DataMigration,type=${type},step=${step.version}`
          );
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
        const error = new Error('No data found to migrate');
        trackError(new ErrorEvent('error', { error }), `context=DataMigration,type=${type}`);
        throw error;
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
        const error = new Error(validationResult.error);
        trackError(new ErrorEvent('error', { error }), `context=DataMigration,type=${type}`);
        throw error;
      }

      // Save migrated data
      localStorage.setItem(storageKey, JSON.stringify(migratedData));

      onMigrationComplete?.(migratedData.version);
    } catch (error) {
      trackError(new ErrorEvent('error', { error }), `context=DataMigration,type=${type}`);
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
          const error = new Error('No data found to rollback');
          trackError(new ErrorEvent('error', { error }), `context=DataMigration,type=${type}`);
          throw error;
        }

        const data = JSON.parse(currentData);
        const currentVersion = getCurrentDataVersion(data);

        if (currentVersion <= targetVersion) {
          migrationInProgress.current = false;
          return;
        }

        // Find the step that matches the target version
        const targetStep = sortedSteps.current.find(step => step.version === targetVersion);

        if (!targetStep) {
          throw new Error(`No migration step found for version ${targetVersion}`);
        }

        // Apply the target step
        const rolledBackData = targetStep.migrate(data);
        rolledBackData.version = targetVersion;

        // Validate rolled back data
        const validationResult = validator.current.validate(type, rolledBackData);
        if (!validationResult.success) {
          const error = new Error(validationResult.error);
          trackError(new ErrorEvent('error', { error }), `context=DataMigration,type=${type}`);
          throw error;
        }

        // Save rolled back data
        localStorage.setItem(storageKey, JSON.stringify(rolledBackData));

        onMigrationComplete?.(targetVersion);
      } catch (error) {
        trackError(
          new ErrorEvent('error', { error }),
          `context=DataMigration,type=${type},targetVersion=${targetVersion}`
        );
        onMigrationError?.(error as Error);
      } finally {
        migrationInProgress.current = false;
      }
    },
    [
      getCurrentDataVersion,
      storageKey,
      type,
      onMigrationStart,
      onMigrationComplete,
      onMigrationError,
      trackError,
    ]
  );

  return {
    runMigration,
    rollback,
    isMigrating: migrationInProgress.current,
  };
};

// Example usage:
/*
const UserPreferences = () => {
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
          typeof data.notifications.email === 'boolean' &&
          typeof data.notifications.push === 'boolean' &&
          typeof data.notifications.desktop === 'boolean'
        );
      },
    },
    {
      version: 2,
      migrate: (data) => ({
        ...data,
        notifications: {
          ...data.notifications,
          sms: false,
          frequency: 'daily',
        },
      }),
      validate: (data) => {
        return (
          data.notifications &&
          typeof data.notifications.sms === 'boolean' &&
          data.notifications.frequency === 'daily'
        );
      },
    },
  ];

  const { runMigration, rollback, isMigrating } = useDataMigration({
    type: 'userPreferences',
    currentVersion: 2,
    storageKey: 'userPreferences',
    steps: migrationSteps,
    onMigrationStart: () => {
      console.log('Migration started');
    },
    onMigrationComplete: (newVersion) => {
      console.log(`Migration completed to version ${newVersion}`);
    },
    onMigrationError: (error) => {
      console.error('Migration failed:', error);
    },
  });

  const handleRollback = () => {
    rollback(1);
  };

  return {
    isMigrating,
    handleRollback,
  };
};
*/
