import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Diceify - Transform Photos into Dice Art'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background Dali image using img tag - same settings as OG */}
        <img
          src="https://diceify.art/images/dali-51x51.png"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -60%)',
            width: '900px',
            height: '900px',
            opacity: 0.2,
            objectFit: 'contain',
          }}
        />

        {/* Left gradient fade - stronger blend */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
            display: 'flex',
            pointerEvents: 'none',
          }}
        />

        {/* Right gradient fade - stronger blend */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '50%',
            height: '100%',
            background: 'linear-gradient(270deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
            display: 'flex',
            pointerEvents: 'none',
          }}
        />

        {/* Logo - icon + text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '55px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Dice icon */}
          <div
            style={{
              width: '180px',
              height: '180px',
              border: '11px solid white',
              borderRadius: '44px',
              position: 'relative',
              display: 'flex',
            }}
          >
            {/* Top-left dot */}
            <div
              style={{
                position: 'absolute',
                top: '36px',
                left: '36px',
                width: '36px',
                height: '36px',
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
            />
            {/* Bottom-right dot */}
            <div
              style={{
                position: 'absolute',
                bottom: '36px',
                right: '36px',
                width: '36px',
                height: '36px',
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
            />
          </div>
          {/* Logo text */}
          <span
            style={{
              fontSize: 150,
              fontWeight: '600',
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            Diceify
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}