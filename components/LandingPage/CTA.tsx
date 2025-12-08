import Link from 'next/link'

export default function CTA() {
    return (
        <section className="cta-section">
            <div className="cta-card">
                <h2>Ready to create?</h2>
                <p>Your first dice art project is waiting.</p>
                <Link href="/editor" className="btn-primary">
                    Start your first piece
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </Link>
            </div>
        </section>
    )
}
