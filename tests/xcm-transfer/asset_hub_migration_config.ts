// Prepare for asset hub migration
// After migration is done, remove this file and fix the tests

export enum AssetHubMigrationStep {
  NotStrated,
  Ongoing,
}

export const KusamaMigationStep: AssetHubMigrationStep = AssetHubMigrationStep.Ongoing
