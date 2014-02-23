from genericgamemode import GenericGameMode
import os

class GameMode(GenericGameMode):
  def __init__(self, path):
    self.main_jar = "craftbukkit-dev.jar"
    self.path = os.path.normpath(path)
    
  def install(self):
    print "INSTALLING"
    self.download_url("http://www.creeperrepo.net/direct/FTB2/18606e7928709218bd2a4386fb84ada9/modpacks%5EMonster%5E1_0_9%5EMonsterServer.zip", "MonsterServer.zip")
    self.unzip("MonsterServer.zip")
    self.delete("MonsterServer.zip")
    self.delete("ServerStart.*")
    self.rename("FTBServer-1.6.4-965.jar", "server.jar")

    return True
    
  def uninstall(self):
    self.delete_r("config")
    self.delete_r("libraries")
    self.delete_r("mods")