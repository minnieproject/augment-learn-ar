import { useState } from "react";
import { Hero } from "@/components/Hero";
import { TopicCard } from "@/components/TopicCard";
import { ARCamera } from "@/components/ARCamera";
import { ARModelViewer } from "@/components/ARModelViewer";
import { toast } from "sonner";

interface Topic {
  id: string;
  title: string;
  description: string;
  image: string;
  modelPath: string;
}

const topics: Topic[] = [
  {
    id: "earth",
    title: "Planet Earth",
    description: "Explore our planet's structure, atmosphere, and geographical features in 3D",
    image: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80",
    modelPath: "/models/Earth2.glb"
  },
  {
    id: "brain",
    title: "Human Brain",
    description: "Explore the human brain anatomy and neural structures in 3D",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
    modelPath: "/models/brain.glb"
  },
  {
    id: "heart",
    title: "Human Heart",
    description: "Discover the anatomy and function of the cardiovascular system",
    image: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&q=80",
    modelPath: "/models/Earth2.glb" // Placeholder - would use heart model
  }
];

const Index = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>(topics);

  const handleSearch = (query: string) => {
    const filtered = topics.filter(topic =>
      topic.title.toLowerCase().includes(query.toLowerCase()) ||
      topic.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTopics(filtered);
    
    if (filtered.length === 0) {
      toast.error("No topics found. Try 'Earth', 'Brain', or 'Heart'");
    } else {
      toast.success(`Found ${filtered.length} topic(s)`);
    }
  };

  const handleViewAR = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowCamera(true);
  };

  const handleImageRecognized = () => {
    setShowCamera(false);
    setShowModel(true);
  };

  const handleCloseModel = () => {
    setShowModel(false);
    setSelectedTopic(null);
  };

  return (
    <div className="min-h-screen">
      <Hero onSearch={handleSearch} />
      
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Available Topics</h2>
          <p className="text-muted-foreground">
            Select a topic to view in augmented reality
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map(topic => (
            <TopicCard
              key={topic.id}
              title={topic.title}
              description={topic.description}
              image={topic.image}
              onViewAR={() => handleViewAR(topic)}
            />
          ))}
        </div>
        
        {filteredTopics.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-muted-foreground">No topics found</p>
            <p className="text-muted-foreground mt-2">Try searching for different terms</p>
          </div>
        )}
      </section>

      {showCamera && selectedTopic && (
        <ARCamera
          onClose={() => setShowCamera(false)}
          onImageRecognized={handleImageRecognized}
          topicTitle={selectedTopic.title}
        />
      )}

      {showModel && selectedTopic && (
        <ARModelViewer
          modelPath={selectedTopic.modelPath}
          topicTitle={selectedTopic.title}
          onClose={handleCloseModel}
        />
      )}
    </div>
  );
};

export default Index;
