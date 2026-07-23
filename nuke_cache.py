import os
import subprocess

subprocess.run('cd /home/perzival/opstask-pro && npx pm2 stop opstask-pro', shell=True)
subprocess.run('cd /home/perzival/opstask-pro && rm -rf .next', shell=True)
subprocess.run('cd /home/perzival/opstask-pro && rm -rf node_modules/.cache', shell=True)
subprocess.run('cd /home/perzival/opstask-pro && npm run build', shell=True)
subprocess.run('cd /home/perzival/opstask-pro && npx pm2 start opstask-pro', shell=True)
