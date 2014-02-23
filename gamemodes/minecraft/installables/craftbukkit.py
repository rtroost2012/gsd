from genericgamemode import GenericGameMode
import os


      
class GameMode(GenericGameMode):
  def __init__(self, path):
    self.main_jar = "craftbukkit-dev.jar"
    self.path = os.path.normpath(path)
    
  def install(self):
    self.download_url("http://dl.bukkit.org/downloads/craftbukkit/get/02540_1.7.2-R0.4/craftbukkit-dev.jar", self.main_jar)
    self.set_cli('-jar', self.main_jar)
    return True
    
  def uninstall(self):
    print "UNINSTALLING"
    
    
