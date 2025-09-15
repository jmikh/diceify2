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
              marginBottom: '35px',
            }}
          >
            {/* Dice icon */}
            <div
              style={{
                width: '65px',
                height: '65px',
                border: '4px solid white',
                borderRadius: '15px',
                position: 'relative',
                marginRight: '22px',
                display: 'flex',
              }}
            >
              {/* Top-left dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '13px',
                  left: '13px',
                  width: '13px',
                  height: '13px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                }}
              />
              {/* Bottom-right dot */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '13px',
                  right: '13px',
                  width: '13px',
                  height: '13px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                }}
              />
            </div>
            {/* Logo text */}
            <span
              style={{
                fontSize: 48,
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
              fontSize: 50,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
            }}
          >
            Transform Photos into
          </div>

          {/* Gradient text */}
          <div
            style={{
              display: 'flex',
              fontSize: 58,
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '25px',
            }}
          >
            Dice Mosaic
          </div>

          {/* Description */}
          <div
            style={{
              display: 'flex',
              fontSize: 22,
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