'use client';

import type { ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export type HandleProps = Record<string, unknown> & { ref: (el: HTMLElement | null) => void };

/**
 * Liste réordonnable par glisser-déposer (souris, toucher, clavier).
 * Au clavier : poignée, Espace pour saisir, flèches, Espace pour déposer, Échap pour annuler.
 * Les annonces pour lecteurs d'écran sont en français.
 */
export function SortableList<T extends { key: string }>({
  items,
  labelOf,
  onMove,
  renderItem,
  className,
}: {
  items: T[];
  labelOf: (item: T) => string;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T, handle: ReactNode, state: { dragging: boolean }) => ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const index = (id: UniqueIdentifier) => items.findIndex((i) => i.key === id);
  const label = (id: UniqueIdentifier) => {
    const item = items[index(id)];
    return item ? `« ${labelOf(item)} »` : 'L’élément';
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(index(active.id), index(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'Pour déplacer cet élément, appuyez sur Espace, utilisez les flèches haut et bas, puis Espace pour le déposer. Échap annule.',
        },
        announcements: {
          onDragStart: ({ active }) => `${label(active.id)} saisi, position ${index(active.id) + 1} sur ${items.length}.`,
          onDragOver: ({ active, over }) =>
            over ? `${label(active.id)} : position ${index(over.id) + 1} sur ${items.length}.` : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${label(active.id)} déposé en position ${index(over.id) + 1}. À enregistrer.` : `${label(active.id)} déposé.`,
          onDragCancel: ({ active }) => `Déplacement annulé. ${label(active.id)} reprend sa place.`,
        },
      }}
    >
      <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item) => (
            <SortableItem key={item.key} id={item.key} label={labelOf(item)}>
              {(handle, dragging) => renderItem(item, handle, { dragging })}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: (handle: ReactNode, dragging: boolean) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      className="adm-handle"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Déplacer « ${label} »`}
    >
      <GripVertical aria-hidden="true" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      id={id}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-dragging={isDragging || undefined}
      className="adm-sortable"
    >
      {children(handle, isDragging)}
    </li>
  );
}
