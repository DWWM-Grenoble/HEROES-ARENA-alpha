// Template pour les détails d'un héros
export function createHeroDetailsModal(hero, index) {
    const healthPercent = (hero.pv / hero.pvMax) * 100;
    const healthColor = healthPercent > 75 ? '#10b981' : 
                       healthPercent > 50 ? '#f59e0b' : 
                       healthPercent > 25 ? '#f97316' : '#ef4444';
    
    return `
        <div class="modal-overlay hero-details-modal">
            <div class="modal-content hero-details-content">
                <div class="modal-header">
                    <div class="hero-details-header">
                        <div class="hero-avatar-large-container">
                            <div class="hero-avatar-large">
                                <img src="assets/avatars/${hero.avatar}" alt="${hero.nom}">
                                <div class="avatar-border-glow"></div>
                            </div>
                            <div class="avatar-decorations">
                                <div class="level-crown">★ ${hero.niveau} ★</div>
                                <div class="hero-badge-ornate">${hero.getBadgeText()}</div>
                            </div>
                        </div>
                        <div class="hero-details-title">
                            <h2 class="hero-name-title">${hero.nom}</h2>
                            <div class="hero-class-badge-enhanced">${hero.classe}</div>
                            <div class="hero-title-decorations">
                                <div class="victory-laurels">🏆 ${hero.victoires > 0 ? 'Vainqueur' : 'Apprenti'}</div>
                                <div class="combat-record">${hero.victoires}V - ${hero.defaites}D</div>
                            </div>
                        </div>
                    </div>
                    <button class="modal-close enhanced-close" data-action="close">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="hero-details-grid">
                        ${createStatsSection(hero)}
                        ${createProgressSection(hero, healthPercent, healthColor)}
                        ${createCombatSection(hero)}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <h3>Actions</h3>
                    <div class="action-buttons">
                        ${createActionButtons(hero, index)}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close-btn">Fermer</button>
                </div>
            </div>
        </div>
    `;
}

function createStatsSection(hero) {
    return `
        <div class="stats-section enhanced">
            <h3 class="section-title">⚡ Attributs du Héros</h3>
            <div class="stats-grid">
                ${createStatBar('force', '⚔️', 'Force', hero.force)}
                ${createStatBar('agility', '🏃', 'Agilité', hero.agility)}
                ${createStatBar('magic', '🔮', 'Magie', hero.magic)}
                ${createStatBar('defense', '🛡️', 'Défense', hero.defense)}
            </div>
            <div class="total-power">
                <span class="power-label">Puissance Totale:</span>
                <span class="power-value">${hero.force + hero.agility + hero.magic + hero.defense}/80</span>
            </div>
        </div>
    `;
}

function createStatBar(statName, icon, label, value) {
    return `
        <div class="stat-detail enhanced">
            <div class="stat-header">
                <span class="stat-icon ${statName}-icon">${icon}</span>
                <span class="stat-name">${label}</span>
            </div>
            <div class="stat-bar-container">
                <div class="stat-bar">
                    <div class="stat-bar-fill ${statName}-fill" style="width: ${(value / 20) * 100}%"></div>
                </div>
                <span class="stat-value">${value}/20</span>
            </div>
        </div>
    `;
}

function createProgressSection(hero, healthPercent, healthColor) {
    const healthStatus = healthPercent > 90 ? 'Excellent' : 
                        healthPercent > 75 ? 'Bon' : 
                        healthPercent > 50 ? 'Affaibli' : 
                        healthPercent > 25 ? 'Blessé' : 'Critique';
    
    return `
        <div class="progress-section enhanced">
            <h3 class="section-title">📈 Évolution & État</h3>
            <div class="vitals-container">
                <div class="health-section enhanced">
                    <div class="vital-header">
                        <span class="vital-icon">💖</span>
                        <span class="vital-name">Points de Vie</span>
                        <span class="vital-status">${healthStatus}</span>
                    </div>
                    <div class="health-bar-detail enhanced">
                        <div class="health-fill animated" style="width: ${healthPercent}%; background-color: ${healthColor}"></div>
                        <div class="health-text">${hero.pv}/${hero.pvMax}</div>
                    </div>
                </div>
                <div class="xp-section enhanced">
                    <div class="vital-header">
                        <span class="vital-icon">⭐</span>
                        <span class="vital-name">Expérience</span>
                        <span class="level-badge">Niv. ${hero.niveau}</span>
                    </div>
                    <div class="xp-bar enhanced">
                        <div class="xp-fill animated" style="width: ${((hero.xp % 100) / 100) * 100}%"></div>
                        <div class="xp-text">${hero.xp % 100}/100 XP</div>
                    </div>
                    <div class="level-progress">
                        <div class="next-level">
                            <span>Prochain niveau: ${100 - (hero.xp % 100)} XP</span>
                            <div class="xp-total">Total: ${hero.xp} XP</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createCombatSection(hero) {
    const trophyIcon = hero.victoires > hero.defaites ? '👑' : 
                      hero.victoires === hero.defaites ? '⚖️' : '🛡️';
    const trophyTitle = hero.victoires > hero.defaites ? 'Champion' : 
                       hero.victoires === hero.defaites ? 'Équilibré' : 'Challenger';
    
    return `
        <div class="combat-section enhanced">
            <h3 class="section-title">🏆 Palmarès de Combat</h3>
            <div class="combat-overview">
                <div class="combat-trophy">
                    <div class="trophy-icon">${trophyIcon}</div>
                    <div class="trophy-title">${trophyTitle}</div>
                </div>
                <div class="winrate-display">
                    <div class="winrate-circle" style="background: conic-gradient(#10b981 ${hero.getRatio() * 3.6}deg, #374151 0deg)">
                        <div class="winrate-text">${hero.getRatio()}%</div>
                    </div>
                </div>
            </div>
            <div class="combat-stats enhanced">
                <div class="combat-stat victories enhanced">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-content">
                        <span class="label">Victoires</span>
                        <span class="value">${hero.victoires}</span>
                    </div>
                </div>
                <div class="combat-stat defeats enhanced">
                    <div class="stat-icon">💀</div>
                    <div class="stat-content">
                        <span class="label">Défaites</span>
                        <span class="value">${hero.defaites}</span>
                    </div>
                </div>
                <div class="combat-stat total enhanced">
                    <div class="stat-icon">⚔️</div>
                    <div class="stat-content">
                        <span class="label">Total</span>
                        <span class="value">${hero.victoires + hero.defaites}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createActionButtons(hero, index) {
    return `
        <button class="action-btn heal-btn" data-action="heal" data-index="${index}">
            <span class="action-icon">💚</span>
            <span class="action-text">
                <strong>Soigner</strong>
                <small>Restaure tous les PV</small>
            </span>
        </button>
        
        <button class="action-btn combat-btn" data-action="combat" data-index="${index}">
            <span class="action-icon">⚔️</span>
            <span class="action-text">
                <strong>Combat</strong>
                <small>Aller à l'arène</small>
            </span>
        </button>
        
        <button class="action-btn rename-btn" data-action="rename" data-index="${index}">
            <span class="action-icon">✏️</span>
            <span class="action-text">
                <strong>Renommer</strong>
                <small>Changer le nom</small>
            </span>
        </button>
        
        <button class="action-btn delete-btn danger" data-action="delete" data-index="${index}" data-hero-id="${hero.id}" data-hero-name="${hero.nom}">
            <span class="action-icon">⚠️</span>
            <span class="action-text">
                <strong>Supprimer définitivement</strong>
                <small>Cette action est irréversible</small>
            </span>
        </button>
    `;
}