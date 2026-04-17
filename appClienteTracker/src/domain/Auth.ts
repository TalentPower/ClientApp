// Domain Entities
export interface AuthUser {
    userId: number;
    name: string;
    email: string;
    phone?: string;
    companyId: number | null;
}

export interface AuthResponse {
    jwt: string;
    userId: number;
    name: string;
    email: string;
    phone?: string;
    companyId: number | null;
}

export interface LoginCredentials {
    phone: string;
    password?: string;
    firebaseToken?: string;
}

export interface RegisterAutoResponse {
    userId: number;
    employeeId: number;
    name: string;
    email: string;
    phone: string;
    companyId: number | null;
    generatedPassword: string | null;
}

export interface RegisterExplicitResponse {
    userId: number;
    employeeId: number;
    name: string;
    email: string;
    phone: string;
    companyId: number | null;
    generatedPassword: null;
}
