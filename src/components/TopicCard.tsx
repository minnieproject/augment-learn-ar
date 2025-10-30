import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface TopicCardProps {
  title: string;
  description: string;
  image: string;
  onViewAR: () => void;
}

export const TopicCard = ({ title, description, image, onViewAR }: TopicCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        
        <Button 
          onClick={onViewAR}
          className="w-full bg-gradient-to-r from-secondary to-secondary-glow hover:shadow-glow transition-all duration-300"
        >
          <Eye className="w-4 h-4 mr-2" />
          View in AR
        </Button>
      </div>
    </Card>
  );
};
