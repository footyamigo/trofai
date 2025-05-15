// "use client"; // We might need to add this if Editor or DocumentProvider require client-side hooks

import Editor from '../components/carousel-maker/Editor'; // Adjusted path
import { DocumentProvider } from '../lib/carousel-maker/DocumentProvider'; // Corrected path

export default function CarouselMakerPage() { // Renamed for clarity
  return (
    <main className="flex-1 h-full min-h-full flex flex-col justify-stretch">
      <DocumentProvider>
        <Editor />
      </DocumentProvider>
    </main>
  );
} 