# fusedepoc-gui
GUI for handling results from Fused EPoC

# Installing
```bash
bash setup.sh
bash compile.sh
```

# Add results
```bash
cd static/js
ln -s your.results.file.json results.js
```

# Serve GUI for web clients
```bash
node_modules/http-server/bin/http-server
```
Point your browser to http://localhost:8080/ (or whatever port
the web server might use). Using 127.0.0.1 probably won't work
due to a bug beyond my control.
