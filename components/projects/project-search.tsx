'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Tag } from 'lucide-react';

interface ProjectSearchProps {
  onSearch: (query: string, tags: string[]) => void;
  availableTags?: string[];
}

export function ProjectSearch({ onSearch, availableTags = [] }: ProjectSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery, selectedTags);
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.target === document.getElementById('search-input')) {
        handleSearch();
      } else if (e.target === document.getElementById('tag-input')) {
        handleTagAdd();
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    onSearch('', []);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold">Rechercher des projets</h3>
      </div>

      {/* Recherche par nom/description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Recherche textuelle</label>
        <div className="flex gap-2">
          <Input
            id="search-input"
            placeholder="Nom du projet, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="outline">
            Rechercher
          </Button>
        </div>
      </div>

      {/* Recherche par tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Filtrer par tags</label>
        <div className="flex gap-2">
          <Input
            id="tag-input"
            placeholder="Ajouter un tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleTagAdd} variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {/* Tags sélectionnés */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Tags disponibles */}
        {availableTags.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-2">Tags disponibles :</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!selectedTags.includes(tag)) {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSearch} className="flex-1">
          Rechercher
        </Button>
        <Button onClick={clearFilters} variant="outline">
          Effacer
        </Button>
      </div>
    </div>
  );
}
