import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Diceify - Transform Photos into Dice Art'
export const size = {
  width: 1200,
  height: 630,
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
        }}
      >
        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            {/* Dice icon */}
            <div
              style={{
                width: '70px',
                height: '70px',
                border: '4px solid white',
                borderRadius: '16px',
                position: 'relative',
                marginRight: '25px',
                display: 'flex',
              }}
            >
              {/* Top-left dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  width: '14px',
                  height: '14px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                }}
              />
              {/* Bottom-right dot */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  right: '14px',
                  width: '14px',
                  height: '14px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                }}
              />
            </div>
            {/* Logo text */}
            <span
              style={{
                fontSize: 52,
                fontWeight: '600',
                color: 'white',
                letterSpacing: '-0.5px',
              }}
            >
              Diceify
            </span>
          </div>

          {/* Main title */}
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '10px',
            }}
          >
            Transform Photos into
          </div>

          {/* Gradient text */}
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '30px',
            }}
          >
            Dice Mosaic
          </div>

          {/* Description */}
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: '#cbd5e1',
            }}
          >
            Helps build real dice mosaic art from your digitial photos.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}