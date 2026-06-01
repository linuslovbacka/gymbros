import { useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { CosmeticIcon } from '../components/CosmeticIcon';
import {
  COSMETICS, SHOP_ITEMS, ALL_SLOTS, SLOT_LABEL, RARITY_COLOR,
  getCosmetic, type Cosmetic, type CosmeticSlot,
} from '../content/cosmetics';

type Tab = 'gear' | 'shop';

export function LockerScreen({ onClose }: { onClose: () => void }) {
  const { profile, buyCosmetic, equipCosmetic, unequipSlot } = useApp();
  const [tab, setTab] = useState<Tab>('gear');
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const owned = useMemo(() => new Set(profile?.owned_cosmetics ?? []), [profile?.owned_cosmetics]);
  const equipped = profile?.equipped ?? {};
  if (!profile) return null;

  const ownedCosmetics = COSMETICS.filter((c) => owned.has(c.slug));

  function isEquipped(c: Cosmetic): boolean {
    return equipped[c.slot] === c.slug;
  }

  function act(c: Cosmetic) {
    setError(undefined);
    if (!owned.has(c.slug)) {
      const r = buyCosmetic(c.slug);
      if (r.error) { setError(r.error); return; }
      return;
    }
    if (isEquipped(c)) unequipSlot(c.slot);
    else equipCosmetic(c.slug);
  }

  const sel = selected ? getCosmetic(selected) : undefined;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back" onClick={onClose}>← Back</button>
        <div className="chips">
          <span className="chip iron"><span className="dot" />{profile.iron} IRON</span>
          <span className="chip grit"><span className="dot" />{profile.grit} GRIT</span>
        </div>
      </div>

      <h1 className="done-title" style={{ fontSize: 28 }}>LOCKER</h1>

      <div className="q-options" style={{ margin: '14px 0' }}>
        <button className={`q-opt ${tab === 'gear' ? 'active' : ''}`} onClick={() => setTab('gear')}>Gear</button>
        <button className={`q-opt ${tab === 'shop' ? 'active' : ''}`} onClick={() => setTab('shop')}>Shop</button>
      </div>

      {tab === 'gear' ? (
        <GearTab
          slots={ALL_SLOTS}
          equipped={equipped}
          ownedCosmetics={ownedCosmetics}
          onSelect={setSelected}
        />
      ) : (
        <ShopTab owned={owned} onSelect={setSelected} />
      )}

      {sel && (
        <DetailSheet
          cosmetic={sel}
          owned={owned.has(sel.slug)}
          equipped={isEquipped(sel)}
          error={error}
          onAct={() => act(sel)}
          onClose={() => { setSelected(null); setError(undefined); }}
        />
      )}
    </div>
  );
}

function GearTab({ slots, equipped, ownedCosmetics, onSelect }: {
  slots: CosmeticSlot[];
  equipped: Record<string, string | null | undefined>;
  ownedCosmetics: Cosmetic[];
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="stack">
      {slots.map((slot) => {
        const items = ownedCosmetics.filter((c) => c.slot === slot);
        const equippedSlug = equipped[slot];
        return (
          <div className="slot-row" key={slot}>
            <div className="slot-label">{SLOT_LABEL[slot]}</div>
            {items.length === 0 ? (
              <div className="slot-empty">— locked —</div>
            ) : (
              <div className="icon-row">
                {items.map((c) => (
                  <button
                    key={c.slug}
                    className={`icon-cell ${equippedSlug === c.slug ? 'on' : ''}`}
                    onClick={() => onSelect(c.slug)}
                  >
                    <CosmeticIcon cosmetic={c} />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShopTab({ owned, onSelect }: { owned: Set<string>; onSelect: (slug: string) => void }) {
  return (
    <div className="shop-grid">
      {SHOP_ITEMS.map((c) => {
        const acq = c.acquire as { type: 'shop'; currency: 'GRIT' | 'IRON'; price: number };
        const have = owned.has(c.slug);
        return (
          <button key={c.slug} className="shop-card" onClick={() => onSelect(c.slug)}>
            <CosmeticIcon cosmetic={c} size={64} />
            <div className="shop-name">{c.name}</div>
            <div className="shop-rarity" style={{ color: RARITY_COLOR[c.rarity] }}>{c.rarity}</div>
            <div className={`shop-price ${acq.currency.toLowerCase()}`}>
              {have ? 'OWNED' : `${acq.price} ${acq.currency}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailSheet({ cosmetic, owned, equipped, error, onAct, onClose }: {
  cosmetic: Cosmetic;
  owned: boolean;
  equipped: boolean;
  error?: string;
  onAct: () => void;
  onClose: () => void;
}) {
  const acq = cosmetic.acquire;
  const actionLabel = !owned
    ? acq.type === 'shop' ? `Buy — ${acq.price} ${acq.currency}` : acq.type === 'achievement' ? 'Locked (achievement)' : 'Locked'
    : equipped ? 'Unequip' : 'Equip';
  const canAct = owned || acq.type === 'shop';

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <CosmeticIcon cosmetic={cosmetic} size={72} />
          <div>
            <div className="sheet-name">{cosmetic.name}</div>
            <div className="sheet-meta" style={{ color: RARITY_COLOR[cosmetic.rarity] }}>
              {cosmetic.rarity} · {SLOT_LABEL[cosmetic.slot]}
            </div>
          </div>
        </div>
        <p className="sheet-desc">{cosmetic.description}</p>
        {error && <div className="sheet-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={!canAct} onClick={onAct}>{actionLabel}</button>
        <button className="btn btn-block" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
