import Link from 'next/link'
import Image from 'next/image'

export default function Craft() {
    return (
        <section className="craft" id="about">
            <div className="craft-content">
                <span className="section-label">The craft</span>
                <h2>Build something real with your hands</h2>
                <p>In a world of screens and swipes, dice art brings you back to the physical. Each piece is a meditative process — placing hundreds of dice, watching an image emerge.</p>
                <p><strong>Diceify handles the planning.</strong> You get the joy of creation.</p>
            </div>
            <div className="craft-visual">
                <div className="craft-card one">
                    <Link
                        href="https://www.youtube.com/watch?v=z4UUXeYqJZw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full relative cursor-pointer"
                    >
                        <Image
                            src="/images/build-real.jpg"
                            alt="Building dice art close up"
                            fill
                            className="object-cover"
                        />
                    </Link>
                </div>
                <div className="craft-card two">
                    <Link
                        href="https://jeremyklammer.com/2023/11/21/dice-art/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full relative cursor-pointer"
                    >
                        <Image
                            src="/images/build-real-2.png"
                            alt="Dice art workspace"
                            fill
                            className="object-cover"
                        />
                    </Link>
                </div>
            </div>
        </section>
    )
}
