// Domain Entities
export interface AuthUser {
    userId: number;
    name: string;
    email: string;
    companyId: number | null;
}

export interface AuthResponse {
    jwt: string;
    userId: number;
    name: string;
    email: string;
    companyId: number | null;
}

export interface LoginCredentials {
    email: string;
    password?: string;
    firebaseToken?: string;
}
