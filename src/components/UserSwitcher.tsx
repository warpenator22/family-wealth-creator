import { useHousehold } from '../context/HouseholdContext';

export function UserSwitcher() {
  const { state, activeMember, setActiveMember } = useHousehold();

  return (
    <div className="user-switcher" role="tablist" aria-label="Household member">
      {state.members.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={m.id === activeMember.id}
          className={m.id === activeMember.id ? 'user-pill active' : 'user-pill'}
          style={{ '--member-color': m.color } as React.CSSProperties}
          onClick={() => setActiveMember(m.id)}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}

