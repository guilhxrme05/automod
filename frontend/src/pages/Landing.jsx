import React from 'react';
import './Landing.css';

const Landing = () => {
  return (
    <section className="landing-hero">
      <div className="hero-overlay"></div>

      <header className="landing-header">
        <span className="logo">AUTOMOD</span>
    
       
        
      </header>

      <main className="hero-content">
        <h1>
          Personalize o carro
          
          dos seus sonhos
        </h1>
        <p>Seu carro, suas regras</p>
        <a href="/registro" className="cta-button">
          comece aqui
        </a>
      </main>

    </section>
  );
};

export default Landing;