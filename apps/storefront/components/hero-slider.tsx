"use client";

import { useState } from "react";

const slides = Array.from({ length: 10 }, (_, index) => index + 1);

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const move = (direction: number) => setActive((current) => (current + direction + slides.length) % slides.length);
  return (
    <section className="hero" aria-label="Kampanyalar">
      <button className="slider-button previous" onClick={() => move(-1)} aria-label="Önceki kampanya">‹</button>
      <picture>
        <source media="(max-width: 700px)" srcSet={`/img/bannermobil${slides[active]}.jpg`} />
        <img src={`/img/banner${slides[active]}.jpg`} alt={`BişeyEksik kampanya ${slides[active]}`} />
      </picture>
      <button className="slider-button next" onClick={() => move(1)} aria-label="Sonraki kampanya">›</button>
      <span className="hero-count">{active + 1} / {slides.length}</span>
    </section>
  );
}
