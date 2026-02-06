# 🔐 GitHub Secrets Setup - Deploy to Devnet

**Objectif** : Configurer les secrets GitHub pour permettre le déploiement automatique sur Solana devnet.

---

## ✅ Ce qui est déjà fait

- [x] GitHub Pages deploye (site live)
- [x] Workflows CI/CD pushés (`.github/workflows/`)
- [x] GitHub PAT avec scope `workflow` configuré

---

## 🎯 Ce qu'il faut faire maintenant

### Étape 1 : Générer le Keypair Base64

**Sur ta machine** (celle qui a ton wallet Solana) :

```bash
# Si tu as déjà un wallet devnet
cat ~/.config/solana/id.json | base64 -w 0

# OU créer un nouveau wallet devnet
solana-keygen new --outfile ~/.config/solana/devnet.json
cat ~/.config/solana/devnet.json | base64 -w 0
```

**Copie le résultat** (une longue chaîne de caractères base64).

---

### Étape 2 : Ajouter le Secret sur GitHub

1. Va sur ton repo : https://github.com/Suprjack/agentmemory-protocol-
2. Clique sur **Settings** (en haut à droite)
3. Dans la sidebar gauche : **Secrets and variables** → **Actions**
4. Clique sur **New repository secret**
5. Remplis :
   - **Name** : `SOLANA_KEYPAIR_DEVNET`
   - **Secret** : (colle le base64 que tu as copié)
6. Clique sur **Add secret**

---

### Étape 3 : Lancer le Workflow de Déploiement

1. Va sur l'onglet **Actions** du repo
2. Dans la liste des workflows, clique sur **Deploy to Devnet**
3. Clique sur **Run workflow** (bouton à droite)
4. Sélectionne la branch `main`
5. Clique sur **Run workflow** (vert)

---

## 🎬 Ce qui va se passer

Le workflow GitHub Actions va :

1. **Setup Solana CLI** (dernière version)
2. **Setup Anchor CLI** (v0.30.1)
3. **Decode ton keypair** (depuis le secret base64)
4. **Build le smart contract** (`anchor build`)
5. **Deploy sur devnet** (`anchor deploy --provider.cluster devnet`)
6. **Te donner l'adresse du programme** (dans les logs)

**Durée estimée** : 3-5 minutes.

---

## 📋 Checklist Rapide

- [ ] Générer le keypair base64
- [ ] Ajouter le secret `SOLANA_KEYPAIR_DEVNET` sur GitHub
- [ ] Lancer le workflow **Deploy to Devnet**
- [ ] Récupérer l'adresse du programme dans les logs
- [ ] Mettre à jour `Anchor.toml` avec la nouvelle adresse
- [ ] Commit + push
- [ ] Poster sur le forum Colosseum 🎉

---

## 🐛 Troubleshooting

### Le workflow fail avec "secret not found"
→ Vérifie que le nom du secret est **exactement** `SOLANA_KEYPAIR_DEVNET` (case-sensitive)

### Le wallet n'a pas assez de SOL
→ Airdrop sur devnet :
```bash
solana airdrop 2 <TON_ADRESSE> --url devnet
```

### Le build fail
→ Vérifie la version d'Anchor dans `Anchor.toml` (doit être 0.30.1)

---

## 🚀 Après le Déploiement

**Tu auras l'adresse du programme déployé.**

**Actions immédiates** :

1. **Update `Anchor.toml`** :
```toml
[programs.devnet]
agentmemory_protocol = "ADRESSE_DU_PROGRAMME"
```

2. **Update `README.md`** (section Deployed Addresses)

3. **Commit + Push** :
```bash
git add Anchor.toml README.md
git commit -m "feat: update devnet program address"
git push
```

4. **Poster sur le forum Colosseum** avec :
   - ✅ Devnet deployed
   - 🔗 Program address
   - 🔗 Explorer link (Solscan devnet)
   - 🔗 GitHub repo
   - 🔗 Live docs

---

**Prêt ? Let's ship! 🚀**
