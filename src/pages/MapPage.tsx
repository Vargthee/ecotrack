import { useQuery } from "@tanstack/react-query";
import { BinMapView } from "@/components/BinMapView";

type Bin = {
  id: string;
  location: string;
  lat: number;
  lng: number;
  fillLevel: number;
  type: string;
  lastCollected?: string;
};

const MapPage = () => {
  const { data: bins = [], isLoading } = useQuery<Bin[]>({ queryKey: ["/api/bins"] });
  return <BinMapView bins={bins} isLoading={isLoading} />;
};

export default MapPage;
