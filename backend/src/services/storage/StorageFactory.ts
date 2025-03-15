import { StorageProvider } from "./StorageProvider";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { CloudStorageProvider } from "./CloudStorageProvider";

export type StorageType = "local" | "cloud" | "hybrid";

export class StorageFactory {
  private static instance: StorageFactory;
  private providers: Map<StorageType, StorageProvider>;
  private currentType: StorageType;

  private constructor() {
    this.providers = new Map();
    this.currentType = (process.env.STORAGE_TYPE as StorageType) || "local";
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize local storage
    this.providers.set("local", new LocalStorageProvider());

    // Initialize cloud storage if configured
    if (process.env.AWS_BUCKET_NAME) {
      this.providers.set("cloud", new CloudStorageProvider());
    }

    // For hybrid, we'll use both providers
    if (this.providers.has("cloud")) {
      this.providers.set("hybrid", this.providers.get("cloud")!);
    } else {
      this.providers.set("hybrid", this.providers.get("local")!);
    }
  }

  public static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  public getProvider(): StorageProvider {
    const provider = this.providers.get(this.currentType);
    if (!provider) {
      throw new Error(`Storage provider ${this.currentType} not configured`);
    }
    return provider;
  }

  public setStorageType(type: StorageType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Storage provider ${type} not configured`);
    }
    this.currentType = type;
  }

  public getStorageType(): StorageType {
    return this.currentType;
  }

  public isHybridAvailable(): boolean {
    return this.providers.has("cloud") && this.providers.has("local");
  }
}
