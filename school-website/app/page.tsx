import Link from 'next/link';

const features = [
  ['01','CBC Excellence','Learner-centred CBC education focused on knowledge, skills, values and character.'],
  ['02','Faith & Character','A caring Christian environment that nurtures discipline, integrity and service.'],
  ['03','Safe Community','A welcoming school community where every learner is known, supported and encouraged.'],
  ['04','Parent Partnership','Clear communication between school and home through the secure Parent Portal.'],
];

export default function Home() {
  return <div className="site">
    <div className="topbar"><span>AIC CATHEDRAL PRIMARY SCHOOL</span><span>Gilgil, Kenya</span><span>Education for Excellence</span></div>
    <nav className="nav"><Link href="/" className="brand"><img src="/aic-cathedral-logo.svg" alt="AIC Cathedral Primary School logo"/><span><b>AIC CATHEDRAL</b><small>PRIMARY SCHOOL · GILGIL</small></span></Link><div className="links"><a href="#about">About</a><a href="#academics">Academics</a><a href="#admissions">Admissions</a><a href="#contact">Contact</a><Link href="/parent-portal" className="portal">Parent Portal</Link></div></nav>
    <main>
      <section className="hero"><div className="hero-copy"><div className="eyebrow">WELCOME TO AIC CATHEDRAL</div><h1>Education for <em>Excellence.</em></h1><p>Growing learners in faith, knowledge, confidence and character. Discover a strong foundation for your child at AIC Cathedral Primary School, Gilgil.</p><div className="actions"><a className="primary" href="#admissions">Admissions</a><Link className="secondary" href="/parent-portal">Parent Portal</Link></div><div className="motto">“Education for Excellence”</div></div><div className="hero-logo"><div className="seal"><img src="/aic-cathedral-logo.svg" alt="AIC Cathedral logo"/></div></div></section>
      <section className="quick"><div><strong>01</strong><span>Quality Learning</span></div><div><strong>02</strong><span>Christian Values</span></div><div><strong>03</strong><span>Co-curricular Growth</span></div><div><strong>04</strong><span>Parent Partnership</span></div></section>
      <section id="about" className="section"><div className="heading"><span>ABOUT US</span><h2>A school built around the whole child.</h2></div><div className="about"><div><p>AIC Cathedral Primary School in Gilgil provides a purposeful learning environment where learners are encouraged to discover their gifts, build confidence and develop a lifelong love of learning.</p><p>Our approach combines academic excellence, Christian character formation, creativity, sports and strong school-home partnership.</p></div><img src="/aic-cathedral-logo.svg" alt="AIC Cathedral Primary School"/></div></section>
      <section id="academics" className="section tinted"><div className="heading"><span>ACADEMICS</span><h2>Learning with purpose.</h2></div><div className="grid">{features.map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>
      <section id="admissions" className="admissions"><div><span>ADMISSIONS</span><h2>Give your child a strong start.</h2><p>Contact the school for current admission requirements, availability and guidance on joining AIC Cathedral Primary School.</p></div><a className="primary red" href="mailto:info@aiccathedral.ac.ke">Enquire about admission</a></section>
      <section id="contact" className="contact"><div><span>CONTACT</span><h2>We would love to hear from you.</h2></div><div><p><b>AIC Cathedral Primary School</b><br/>P.O. Box 37, Gilgil, Kenya</p><p>Email: info@aiccathedral.ac.ke</p></div></section>
    </main>
    <footer><span>© 2026 AIC Cathedral Primary School</span><span>Education for Excellence</span></footer>
  </div>;
}