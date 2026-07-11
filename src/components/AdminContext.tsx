"use client";
import { createContext, useContext } from "react";

export const AdminContext = createContext<any>(null);

export const useAdmin = () => useContext(AdminContext);
