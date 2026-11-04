import { MongoClient, ObjectId, type Db, type Document } from "mongodb";

export interface UserDocument extends Document {
  _id?: ObjectId;
  username: string;
  usernameNormalized: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  address: string | null;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDocument extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  email: string;
  total: number;
  address: string;
  items: OrderItem[];
  payment: "cod" | "card";
  status: "pending";
  createdAt: Date;
}

export interface ContactDocument extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export interface ProductDocument extends Document {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  types: string[];
  vegMenu?: boolean;
}

export interface CategoryDocument extends Document {
  id: string;
  name: string;
}

type MongoGlobal = typeof globalThis & {
  momoMongoClient?: MongoClient;
  momoMongoDatabase?: Promise<Db>;
};

const globalForMongo = globalThis as MongoGlobal;

async function connectToDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Database is not configured. Set MONGODB_URI to your MongoDB connection string.");
  }

  const client = globalForMongo.momoMongoClient ?? new MongoClient(uri);
  globalForMongo.momoMongoClient = client;
  await client.connect();

  const uriDatabase = decodeURIComponent(new URL(uri).pathname.replace(/^\/+/, "").split("/")[0] ?? "");
  const database = client.db(process.env.MONGODB_DB || uriDatabase || "momo_delights");
  await Promise.all([
    database.collection<UserDocument>("users").createIndex(
      { usernameNormalized: 1 },
      { unique: true, name: "users_username_unique" },
    ),
    database.collection<UserDocument>("users").createIndex(
      { emailNormalized: 1 },
      { unique: true, name: "users_email_unique" },
    ),
    database.collection<OrderDocument>("orders").createIndex(
      { userId: 1, createdAt: -1 },
      { name: "orders_user_created" },
    ),
    database.collection<ProductDocument>("products").createIndex(
      { id: 1 },
      { unique: true, name: "products_id_unique" },
    ),
    database.collection<CategoryDocument>("categories").createIndex(
      { id: 1 },
      { unique: true, name: "categories_id_unique" },
    ),
  ]);
  return database;
}

export async function getDatabase(): Promise<Db> {
  if (!globalForMongo.momoMongoDatabase) {
    globalForMongo.momoMongoDatabase = connectToDatabase().catch((error: unknown) => {
      globalForMongo.momoMongoDatabase = undefined;
      throw error;
    });
  }
  return globalForMongo.momoMongoDatabase;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}

export { ObjectId };
