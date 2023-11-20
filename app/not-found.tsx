import { LottieDisplayOnSSR } from '@/src/lottie/LottieDisplayOnSSR'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='content text-center flex items-center justify-center flex-col max-w-lg'>
      <h2>Erreur 404</h2>
      <p>Nous ne trouvons pas la page demandée.</p>
      <Link href="/">Revenir sur la page d&apos;accueil</Link>
      <LottieDisplayOnSSR animation="404" autoplay={true} loop={true} />
    </div>
  )
}