import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

// Ícone do Menu (Hambúrguer)
const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

// Ícone de Fechar (X)
const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Função para fechar o menu ao clicar num link (em mobile)
    const handleLinkClick = () => {
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <>
            <header className="navbar">
                <div className="navbar-container">
                    <NavLink to="/" className="navbar-logo">
                        AUTOMOD<span>_</span>
                    </NavLink>

                    <nav className="nav-menu">
                        <NavLink to="/home" className="nav-link" onClick={handleLinkClick}>Explorar</NavLink>
                        <NavLink to="/login" className="nav-link" onClick={handleLinkClick}>Login</NavLink>
                        <NavLink to="/registro" className="nav-link" onClick={handleLinkClick}>Registro</NavLink>
                        <NavLink to="/perfil" className="nav-link" onClick={handleLinkClick}>Perfil</NavLink>
                    </nav>

                    <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
                        {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                    </div>
                </div>
            </header>
            
            {/* Menu mobile que aparece como um overlay */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <nav className="mobile-nav-links">
                    <NavLink to="/home" className="nav-link" onClick={handleLinkClick}>Explorar</NavLink>
                    <NavLink to="/login" className="nav-link" onClick={handleLinkClick}>Login</NavLink>
                    <NavLink to="/registro" className="nav-link" onClick={handleLinkClick}>Registro</NavLink>
                    <NavLink to="/perfil" className="nav-link" onClick={handleLinkClick}>Perfil</NavLink>
                </nav>
            </div>
        </>
    );
};

export default Navbar;
