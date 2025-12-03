import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Ajuste a URL base conforme seu ambiente (prod ou dev)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        // Tenta recuperar o usuário se a página for recarregada
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    const login = async (email, senha) => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, senha });
            const { token, usuario } = res.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(usuario));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(usuario);
            return { sucesso: true };
        } catch (error) {
            return { sucesso: false, msg: error.response?.data?.erro || 'Erro no login' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, API_URL }}>
            {children}
        </AuthContext.Provider>
    );
};