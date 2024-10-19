import { Providers } from './providers'
import HomeStatic from './components/HomeStatic'

export const metadata = {
  title: 'ShaFood - Save Money, Eat Together!',
  description: 'ShaFood helps you save on delivery charges by ordering together with nearby users.',
}

export default function Page() {
  return (
    <Providers>
      <HomeStatic />
    </Providers>
  )
}
