perms.js: perms.c
	emcc perms.c -o perms.js -s EXPORTED_FUNCTIONS="['_simulate', '_pairings', '_totalPairings']"
