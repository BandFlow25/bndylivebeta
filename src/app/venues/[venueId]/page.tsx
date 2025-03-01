// src/app/venues/[venueId]/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { getVenueById, updateVenue } from "@/lib/services/venue-service";
import { getEventsForVenue } from "@/lib/services/event-service";
import { Venue, Event, SocialMediaURL } from "@/lib/types";
import { Map as MapIcon, ExternalLink, Globe, Facebook, Phone, Mail, XCircle, Plus } from "lucide-react";
import DetailHeader from "@/components/shared/VADetailHeader";
import VAEventsList from "@/components/shared/VAEventsList";
import EventInfoOverlay from "@/components/overlays/EventInfoOverlay";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import EditModeToggle from "@/components/shared/EditModeToggle";
import ClaimPageButton from "@/components/shared/ClaimPageButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { VenueAddEventButton } from "@/components/events/VenueAddEventButton";

function VenueProfileContent() {
  const params = useParams();
  const venueId = params.venueId as string;

  // State for viewing mode
  const [venue, setVenue] = useState<Venue | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Venue>>({});
  const [socialLinks, setSocialLinks] = useState<{
    website: string;
    facebook: string;
  }>({
    website: "",
    facebook: ""
  });
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState("");

  useEffect(() => {
    if (!venueId) {
      setError("No venue ID provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const venueData = await getVenueById(venueId);
        if (!venueData) {
          setError(`Venue not found with ID: ${venueId}`);
          setLoading(false);
          return;
        }
        setVenue(venueData);
        
        // Initialize edit form data
        setEditFormData({
          name: venueData.name,
          description: venueData.description || "",
          address: venueData.address ? `${venueData.address}${venueData.postcode ? ', ' + venueData.postcode : ''}` : "",
          phone: venueData.phone || "",
          email: venueData.email || ""
        });
        
        // Initialize facilities
        setFacilities(venueData.facilities || []);
        
        // Initialize social links
        const links = {
          website: "",
          facebook: ""
        };
        
        if (venueData.socialMediaURLs && venueData.socialMediaURLs.length > 0) {
          venueData.socialMediaURLs.forEach(social => {
            if (social.platform === 'website' || social.platform === 'facebook') {
              links[social.platform] = social.url;
            }
          });
        }
        
        setSocialLinks(links);

        const venueEvents = await getEventsForVenue(venueId);
        setEvents(venueEvents || []);

        setError(null);
      } catch (error) {
        console.error("Error fetching venue data:", error);
        setError(`Failed to load venue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [venueId]);

  const getGoogleMapsUrl = () => {
    if (!venue) return "#";
    const query = `${venue.name}, ${venue.address || ''} ${venue.postcode || ''}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleAddFacility = () => {
    if (!newFacility.trim()) return;
    
    if (!facilities.includes(newFacility.trim())) {
      setFacilities(prev => [...prev, newFacility.trim()]);
    }
    
    setNewFacility("");
  };

  const handleRemoveFacility = (facilityToRemove: string) => {
    setFacilities(prev => prev.filter(facility => facility !== facilityToRemove));
  };

  const handleSaveChanges = async () => {
    if (!venue) return;
    
    // Convert social links to the required format
    const socialMediaURLs: SocialMediaURL[] = Object.entries(socialLinks)
      .filter(([_, url]) => url.trim() !== "")
      .map(([platform, url]) => ({
        platform: platform as any,
        url: url.trim()
      }));
    
    // Prepare the updated venue data
    const updatedVenue: Venue = {
      ...venue,
      ...editFormData,
      facilities,
      socialMediaURLs,
      updatedAt: new Date().toISOString()
    };
    
    // Save to the database
    await updateVenue(updatedVenue);
    
    // Update the local state
    setVenue(updatedVenue);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse text-center">Loading venue profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center text-red-500">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="mt-4">{error}</p>
          <Link href="/" className="text-[var(--secondary)] hover:underline mt-4 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Venue Not Found</h1>
          <p className="mt-4">The venue you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="text-[var(--secondary)] hover:underline mt-4 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <DetailHeader item={venue} type="venue" />

      {/* Main Content */}
      <div className="container mx-auto pt-28 pb-20 px-4 overflow-y-auto max-h-screen">
        {/* Venue Information Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Venue Information</h2>
            {/* Add VenueAddEventButton here */}
            <VenueAddEventButton 
              venue={venue} 
              className="px-4 py-2 rounded-md text-sm" 
            />
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Venue Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={editFormData.name || ""}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={editFormData.description || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Full Address (including postcode)
                </label>
                <Textarea
                  id="address"
                  name="address"
                  value={editFormData.address || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full"
                  placeholder="Enter complete address with postcode"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={editFormData.phone || ""}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    value={editFormData.email || ""}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Social Media
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-[var(--foreground)]/70" />
                    <Input
                      placeholder="Website URL"
                      value={socialLinks.website}
                      onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <Facebook className="w-5 h-5 mr-2 text-[var(--foreground)]/70" />
                    <Input
                      placeholder="Facebook URL"
                      value={socialLinks.facebook}
                      onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Facilities
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {facilities.map((facility, index) => (
                    <div 
                      key={index} 
                      className="px-3 py-1 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-full flex items-center gap-1"
                    >
                      <span>{facility}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFacility(facility)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--secondary)]/20"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a facility (e.g., Parking, Food, Sound System)"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFacility();
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddFacility}
                    className="px-4 py-2 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-md hover:bg-[var(--secondary)]/20"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[var(--foreground)]/80 mb-4">
                {venue.description || "No description available for this venue."}
              </p>
              
              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {(venue.phone || venue.email) && (
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Contact</h3>
                    {venue.phone && (
                      <div className="flex items-center text-sm text-[var(--foreground)]/70 mb-1">
                        <Phone className="w-4 h-4 mr-2 text-[var(--secondary)]" />
                        <span>{venue.phone}</span>
                      </div>
                    )}
                    {venue.email && (
                      <div className="flex items-center text-sm text-[var(--foreground)]/70">
                        <Mail className="w-4 h-4 mr-2 text-[var(--secondary)]" />
                        <span>{venue.email}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Facilities */}
                {venue.facilities && venue.facilities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Facilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {venue.facilities.map((facility, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-full text-sm"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
   
        {/* Tabs for Events and Map */}
        <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            {events.length > 0 ? (
              <VAEventsList
                events={events}
                contextType="venue"
                onSelectEvent={(event) => {
                  setSelectedEvent(event);
                  setShowEventOverlay(true);
                }}
              />
            ) : (
              <div className="py-6 text-center text-[var(--foreground)]/60">
                <p>No upcoming events scheduled at this venue.</p>
              </div>
            )}
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <Card className="p-4">
              <div className="aspect-video relative rounded-md overflow-hidden">
                {venue.location ? (
                  <iframe
                    title={`Map of ${venue.name}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                      `${venue.name}, ${venue.address || ''} ${venue.postcode || ''}`.trim()
                    )}`}
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                    <p className="text-[var(--foreground)]/70">No location data available</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-[var(--secondary)] hover:underline"
                >
                  <MapIcon className="w-4 h-4 mr-1" />
                  Open in Google Maps
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Claim this page button */}
        <ClaimPageButton type="venue" id={venueId as string} />

        {/* Edit Mode Toggle */}
        <EditModeToggle
          type="venue"
          id={venueId as string}
          isEditing={isEditing}
          onEditModeChange={setIsEditing}
          onSave={handleSaveChanges}
        />

        {/* Event Info Overlay */}
        {selectedEvent && (
          <EventInfoOverlay
            event={selectedEvent}
            isOpen={showEventOverlay}
            onClose={() => {
              setShowEventOverlay(false);
              setSelectedEvent(null);
            }}
            position="list"
          />
        )}
      </div>
    </>
  );
}

export default function VenueProfilePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 px-4">
        <div className="animate-pulse text-center">Loading venue profile...</div>
      </div>
    }>
      <VenueProfileContent />
    </Suspense>
  );
}