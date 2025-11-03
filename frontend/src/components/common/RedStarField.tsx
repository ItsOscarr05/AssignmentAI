import React, { useEffect, useRef } from 'react';

const RED_SHADES = ['#D32F2F', '#FF5252', '#B71C1C', '#FF8A80', '#FF1744'];

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  shape: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, size, 0, 2 * Math.PI);
  } else if (shape === 'cross') {
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  if (shape === 'circle' || shape === 'diamond') ctx.fill();
  if (shape === 'cross' || shape === 'diamond') ctx.stroke();
  ctx.restore();
}

type RedStarFieldProps = {
  starCount?: number;
  contentHeight?: number;
  excludeYStart?: number;
  excludeYEnd?: number;
};

const RedStarField: React.FC<RedStarFieldProps> = ({
  starCount = 220,
  contentHeight,
  excludeYStart = 0,
  excludeYEnd = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawStars = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth * dpr;
    const height = (contentHeight || window.innerHeight) * dpr;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = `${contentHeight || window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let drawn = 0;
    let attempts = 0;
    while (drawn < starCount && attempts < starCount * 10) {
      const x = randomBetween(0, width);
      const y = randomBetween(0, height);
      // Exclude stars in the forbidden Y range
      if (y / dpr >= excludeYStart && y / dpr <= excludeYEnd) {
        attempts++;
        continue;
      }
      const size = randomBetween(1.2, 3.5) * dpr;
      const color = RED_SHADES[Math.floor(Math.random() * RED_SHADES.length)];
      const shape = ['circle', 'cross', 'diamond'][Math.floor(Math.random() * 3)];
      drawStar(ctx, x, y, size, color, shape);
      drawn++;
      attempts++;
    }
  };

  useEffect(() => {
    drawStars();
    window.addEventListener('resize', drawStars);
    return () => {
      window.removeEventListener('resize', drawStars);
    };
    // eslint-disable-next-line
  }, [starCount, contentHeight, excludeYStart, excludeYEnd]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
};

export default RedStarField;
