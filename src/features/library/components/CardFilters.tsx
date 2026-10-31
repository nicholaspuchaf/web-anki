import type { CardFilters as Filters } from '../filter-cards';
import { emptyFilters } from '../filter-cards';
export function CardFilters({
  value,
  onChange,
  tags,
}: {
  value: Filters;
  onChange: (value: Filters) => void;
  tags: string[];
}) {
  return (
    <div className="library-filters">
      <label className="search-field">
        Buscar problema
        <input
          type="search"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Título, número ou tag…"
        />
      </label>
      <label>
        Dificuldade
        <select
          value={value.difficulty}
          onChange={(e) => onChange({ ...value, difficulty: e.target.value })}
        >
          <option value="">Todas</option>
          <option value="easy">Fácil</option>
          <option value="medium">Médio</option>
          <option value="hard">Difícil</option>
        </select>
      </label>
      <label>
        Filtrar por tag
        <select
          value={value.tag}
          onChange={(e) => onChange({ ...value, tag: e.target.value })}
        >
          <option value="">Todas as tags</option>
          {tags.map((tag) => (
            <option key={tag}>{tag}</option>
          ))}
        </select>
      </label>
      <button
        className={value.favorites ? 'filter-active' : ''}
        aria-pressed={value.favorites}
        onClick={() => onChange({ ...value, favorites: !value.favorites })}
      >
        ☆ Favoritos
      </button>
      {(value.query || value.tag || value.difficulty || value.favorites) && (
        <button onClick={() => onChange(emptyFilters)}>Limpar filtros</button>
      )}
    </div>
  );
}
