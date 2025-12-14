import { WifiOff } from 'iconoir-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="bg-orange-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Vous êtes hors ligne
        </h1>
        <p className="text-foreground/60 mb-6">
          Il semble que vous ayez perdu votre connexion internet. Pas de souci, vous pouvez toujours :
        </p>
        <ul className="text-left text-foreground/80 space-y-2 mb-8">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Consulter les statistiques et l'historique de parties en cache</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Créer et modifier des objectifs (ils seront synchronisés au retour en ligne)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Parcourir les données déjà chargées</span>
          </li>
        </ul>
        <div className="text-sm text-foreground/40">
          Vos modifications seront automatiquement synchronisées dès que vous vous reconnecterez.
        </div>
      </div>
    </div>
  );
}
