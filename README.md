# fusedepoc-gui
GUI for handling results from Fused EPoC

# Installing node modules
```bash
bash setup.sh
```

# Add results
```bash
cd static/js
ln -s your.results.file.json results.js
```

# Compiling
```bash
bash compile.sh
```

# Serve GUI for web clients
```bash
node_modules/http-server/bin/http-server
```
