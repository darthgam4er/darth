
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/study');
  return null; 
}
