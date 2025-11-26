import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Linkedin, Loader2 } from "lucide-react";

export default function WallOfFameDisplay({ sectionId }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [flippedPerson, setFlippedPerson] = useState(null);

  const { data: section, isLoading: sectionLoading } = useQuery({
    queryKey: ['wall-of-fame-section', sectionId],
    queryFn: async () => {
      const sections = await base44.entities.WallOfFameSection.list();
      return sections.find(s => s.id === sectionId);
    },
    enabled: !!sectionId,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['wall-of-fame-categories', sectionId],
    queryFn: async () => {
      const cats = await base44.entities.WallOfFameCategory.list();
      return cats.filter(c => c.section_id === sectionId && c.is_active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
    enabled: !!sectionId,
  });

  const { data: people = [], isLoading: peopleLoading } = useQuery({
    queryKey: ['wall-of-fame-people', selectedCategory?.id],
    queryFn: async () => {
      const allPeople = await base44.entities.WallOfFamePerson.list();
      return allPeople.filter(p => p.category_id === selectedCategory.id && p.is_active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
    enabled: !!selectedCategory,
  });

  const { data: photoSizeSetting } = useQuery({
    queryKey: ['wall-of-fame-photo-size'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const setting = allSettings.find(s => s.setting_key === 'wall_of_fame_photo_size');
      return setting?.setting_value || 'medium';
    }
  });

  const photoSize = photoSizeSetting || 'medium';
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-40 h-40'
  };

  const isLoading = sectionLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Section not found</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {section.name}
          </h2>
          {section.description && (
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              {section.description}
            </p>
          )}
        </div>

        {!selectedCategory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <Card
                key={category.id}
                className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-blue-500 bg-white"
                onClick={() => setSelectedCategory(category)}
              >
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-slate-600">
                      {category.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <div className="mb-8 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setFlippedPerson(null);
                }}
                className="mb-4"
              >
                ← Back to Categories
              </Button>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {selectedCategory.name}
              </h3>
              {selectedCategory.description && (
                <p className="text-slate-600">{selectedCategory.description}</p>
              )}
            </div>

            {peopleLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {people.map(person => (
                  <div
                    key={person.id}
                    className="perspective-1000"
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className={`relative w-full h-96 transition-all duration-700 cursor-pointer transform-style-3d ${
                        flippedPerson === person.id ? 'rotate-y-180' : ''
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: flippedPerson === person.id ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                      onClick={() => setFlippedPerson(flippedPerson === person.id ? null : person.id)}
                    >
                      {/* Front of card */}
                      <div
                        className="absolute w-full h-full backface-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <Card className="w-full h-full p-6 flex flex-col items-center justify-center text-center border-2 border-slate-200 hover:border-blue-500 transition-colors bg-white">
                          <div className={`${sizeClasses[photoSize]} rounded-full bg-slate-100 flex items-center justify-center overflow-hidden mb-4 flex-shrink-0 aspect-square`} style={{ minWidth: photoSize === 'large' ? '10rem' : photoSize === 'medium' ? '8rem' : '6rem', minHeight: photoSize === 'large' ? '10rem' : photoSize === 'medium' ? '8rem' : '6rem' }}>
                            {person.profile_photo_url ? (
                              <img
                                src={person.profile_photo_url}
                                alt={`${person.first_name} ${person.last_name}`}
                                className="w-full h-full object-cover"
                                style={{ borderRadius: '50%' }}
                              />
                            ) : (
                              <User className={`${photoSize === 'large' ? 'w-20 h-20' : photoSize === 'medium' ? 'w-16 h-16' : 'w-12 h-12'} text-slate-400`} />
                            )}
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mb-1">
                            {person.first_name} {person.last_name}
                          </h4>
                          {person.job_title && (
                            <p className="text-sm text-slate-600">{person.job_title}</p>
                          )}
                          {(person.secondary_organisation || person.secondary_job_title) && (
                            <>
                              <div className="w-12 h-px bg-slate-300 mx-auto my-2"></div>
                              {person.secondary_job_title && (
                                <p className="text-xs text-slate-600">{person.secondary_job_title}</p>
                              )}
                              {person.secondary_organisation && (
                                <p className="text-xs text-slate-500">{person.secondary_organisation}</p>
                              )}
                            </>
                          )}
                          <p className="text-xs text-slate-400 mt-4">Click to view details</p>
                        </Card>
                      </div>

                      {/* Back of card */}
                      <div
                        className="absolute w-full h-full backface-hidden"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <Card className="w-full h-full p-6 overflow-y-auto border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white">
                          <div className="flex flex-col h-full">
                            <div className="text-center mb-4">
                              <h4 className="text-lg font-bold text-slate-900 mb-1">
                                {person.first_name} {person.last_name}
                              </h4>
                              {person.job_title && (
                                <p className="text-sm text-blue-600 font-medium">{person.job_title}</p>
                              )}
                              {(person.secondary_organisation || person.secondary_job_title) && (
                                <>
                                  <div className="w-16 h-px bg-slate-300 mx-auto my-2"></div>
                                  {person.secondary_job_title && (
                                    <p className="text-xs text-slate-700">{person.secondary_job_title}</p>
                                  )}
                                  {person.secondary_organisation && (
                                    <p className="text-xs text-slate-600">{person.secondary_organisation}</p>
                                  )}
                                </>
                              )}
                            </div>

                            {person.biography && (
                              <div className="flex-1 overflow-y-auto mb-4">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {person.biography}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-col gap-2 mt-auto">
                              {person.email && (
                                <a
                                  href={`mailto:${person.email}`}
                                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail className="w-4 h-4" />
                                  Email
                                </a>
                              )}
                              {person.linkedin_url && (
                                <a
                                  href={person.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Linkedin className="w-4 h-4" />
                                  LinkedIn
                                </a>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-4 text-center">Click to flip back</p>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}