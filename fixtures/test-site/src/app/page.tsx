import { Editable } from "@/lib/handoff/components"

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section style={{ padding: '80px 20px', textAlign: 'center', background: '#f8f9fa' }}>
        <Editable field="section.title_build_faster_with" tag="h1" style={{ fontSize: '3rem', marginBottom: '16px' }}>Build faster with AI</Editable>

        
        <Editable field="section.description_ship_beautiful_websites" tag="p" style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px', margin: '0 auto 32px' }}>Ship beautiful websites in hours, not weeks. Our platform helps you go from idea to production faster than ever.</Editable>

        
        <Editable field="section.cta_get_started_free" tag="a"
        href="/pricing"
        style={{
          display: 'inline-block',
          padding: '12px 32px',
          background: '#0070f3',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600
        }}>Get Started Free</Editable>


        
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <Editable field="section.title_everything_you_need" tag="h2" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '48px' }}>Everything you need to ship fast</Editable>

        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #eee' }}>
            <Editable field="section.title_lightning_fast" tag="h3" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Lightning Fast</Editable>
            <Editable field="section.description_deploy_in_seconds" tag="p" style={{ color: '#666', lineHeight: 1.6 }}>Deploy in seconds with our global edge network. Your site loads instantly everywhere.</Editable>

            
          </div>
          <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #eee' }}>
            <Editable field="section.title_secure_by_default" tag="h3" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Secure by Default</Editable>
            <Editable field="section.description_enterprisegrade_security_out" tag="p" style={{ color: '#666', lineHeight: 1.6 }}>Enterprise-grade security out of the box. SSL, DDoS protection, and more included.</Editable>

            
          </div>
          <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #eee' }}>
            <Editable field="section.title_scale_infinitely" tag="h3" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Scale Infinitely</Editable>
            <Editable field="section.description_from_zero_to" tag="p" style={{ color: '#666', lineHeight: 1.6 }}>From zero to millions of users without breaking a sweat. Pay only for what you use.</Editable>

            
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ padding: '80px 20px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <Editable field="section.title_what_our_users" tag="h2" style={{ fontSize: '2rem', marginBottom: '48px' }}>What our users say</Editable>
          <Editable field="section.quote_this_platform_completely" tag="blockquote" style={{ fontSize: '1.25rem', fontStyle: 'italic', color: '#444', marginBottom: '16px' }}>“This platform completely changed how we build websites. What used to take weeks now takes hours.”</Editable>

          
          <Editable field="section.description_sarah_chen" tag="p" style={{ fontWeight: 600 }}>Sarah Chen</Editable>
          <Editable field="section.description_cto_at_techstart" tag="p" style={{ color: '#666' }}>CTO at TechStart</Editable>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Editable field="section.title_ready_to_build" tag="h2" style={{ fontSize: '2rem', marginBottom: '16px' }}>Ready to build faster?</Editable>
        <Editable field="section.description_join_thousands_of" tag="p" style={{ fontSize: '1.125rem', color: '#666', marginBottom: '32px' }}>Join thousands of developers shipping with confidence.</Editable>

        
        <Editable field="section.cta_start_building_today" tag="a"
        href="/signup"
        style={{
          display: 'inline-block',
          padding: '12px 32px',
          background: '#0070f3',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600
        }}>Start Building Today</Editable>


        
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', borderTop: '1px solid #eee', textAlign: 'center', color: '#999' }}>
        <Editable field="footer.description_2026_acme" tag="p">© 2026 Acme Inc. All rights reserved.</Editable>
      </footer>
    </main>);

}