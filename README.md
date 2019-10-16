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
Point your browser to http://localhost:8080/ (or whatever port
the web server might use). Using 127.0.0.1 probably will make
the gene card information malfunction due to a bug beyond my control.
