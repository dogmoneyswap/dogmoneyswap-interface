import Container from '../components/Container'
import Head from 'next/head'

export default function Dashboard() {
  return (
    <Container id="dashboard-page" className="py-4 md:py-8 lg:py-12" maxWidth="2xl">
      <Head>
        <title>Dashboard | DOGMONEY</title>
        <meta name="description" content="Mist" />
      </Head>
    </Container>
  )
}
