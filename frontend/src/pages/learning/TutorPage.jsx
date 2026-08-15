import AiTutorWidget from '../../components/tutor/AiTutorWidget';

export default function TutorPage() {
  return (
    <div className="animate-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Tuteur IA</h1>
        <p className="page-subtitle">Ton assistant pédagogique personnel, disponible à tout moment</p>
      </div>
      <div className="h-[calc(100vh-200px)]">
        <AiTutorWidget context={{ lesson_titre: 'Session libre' }} />
      </div>
    </div>
  );
}
