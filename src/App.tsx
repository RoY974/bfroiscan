import {Button, TextView, contentView, Tab, TabFolder, Constraint} from 'tabris';

export class App {

  public start() {
    contentView.append(
      <$>
        <TabFolder paging stretch selectionIndex={0} tabBarLocation='bottom'>
          <Tab id='ACCUEIL' title='Accueil'>
            <Button center onSelect={this.showText}>Initialisation</Button>
            <TextView id='TEMP0' centerX bottom={[Constraint.prev, 20]} font={{size: 24}}/>
          </Tab>
          <Tab id='SCAN' title='Scanner' visible={false}>
            <Button center enabled={false}>Scanner</Button>
            <TextView id='TEMP1' centerX bottom={[Constraint.prev, 20]} font={{size: 24}} text='Partie scan a creer'/>
          </Tab>
          <Tab id='CONTENU' title='Contenu' visible={false}>
            <Button center>Lister</Button>
            <TextView id='TEMP2' centerX bottom={[Constraint.prev, 20]} font={{size: 24}} text='Partie liste a creer'/>
          </Tab>
        </TabFolder>
      </$>
    );
  }

  private showText = () => {
    $(TextView).only('#TEMP0').text = 'Fichier a creer !';
    $(Tab).only('#SCAN').visible = true;
  };

}
