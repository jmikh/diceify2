export default function HowItWorks() {
    return (
        <section className="how-it-works" id="how">
            <div className="section-header">
                <span className="section-label">How it works</span>
                <h2>From photo to art in three steps</h2>
            </div>
            <div className="steps">
                <div className="step">
                    <div className="step-number">1</div>
                    <h3>Upload your photo</h3>
                    <p>Choose any image and crop it to the area you want to diceify. Zoomed in faces work best.</p>
                </div>
                <div className="step">
                    <div className="step-number">2</div>
                    <h3>Tune your design</h3>
                    <p>Adjust contrast, size, and detail level. Preview exactly how your dice art will look before building.</p>
                </div>
                <div className="step">
                    <div className="step-number">3</div>
                    <h3>Build with guidance</h3>
                    <p>Follow the step-by-step placement guide. We show you exactly which dice goes where, row by row.</p>
                </div>
            </div>
        </section>
    )
}
