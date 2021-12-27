import {Button, TextView, contentView, Tab, TabFolder, Constraint, TextInput, Row, ScrollView, ImageView, Composite, fs} from 'tabris';

const REPERTOIRE = fs.cacheDir + '/inv';
const FICHIER = REPERTOIRE + '/scan.txt';

export class App {

  private bscan = new esbarcodescanner.BarcodeScannerView({
    id: 'BSCAN'
  })

  public start() {
    contentView.append(
      <$>
        <TabFolder paging stretch selectionIndex={0} tabBarLocation='bottom'>
          <Tab id='ACCUEIL' title='Accueil'>
          <ImageView id='LOGO' centerX image='resources/logo.png' height={180} scaleMode='auto' onSwipeUp={this.wipFic}/>
          <Button bottom={50} onSelect={this.fileInit}>Initialisation</Button>
            <TextView id='INFOFIC' centerX bottom={[Constraint.prev, 20]} font={{size: 15}}/>
          </Tab>
          <Tab id='SCAN' title='Scanner' visible={false} onResize={this.scanResize}>
            <TextView id='MARQSC' left={10} right={[Constraint.prev, 10]} background='black'>Camera</TextView>
            <Row id='LIGA' stretchX top={[Constraint.prev, 2]} height={25} spacing={5}>
              <TextView id='CODART' markupEnabled font={{size: 15}}><b>CODE ARTICLE</b></TextView>
              <TextView id='DESART' markupEnabled font={{size: 10}} stretchX>LIBELLE ARTICLE</TextView>
            </Row>
            <Row id='LIGB' stretchX top={[Constraint.prev, 2]} height={45} spacing={10}>
              <Button id='BOUSCAN' onSelect={this.startScanner}>Scanner</Button>
              <TextInput id='COMPTE' stretchX padding={[5,2,2,5]} font={{size: 17}} onAccept={this.validScan} enterKeyType='done' keyboard='number' enabled={false}/>
              <Button id='ANNULER' onSelect={this.annulScan} enabled={false}>Annuler</Button>
            </Row>
            <Composite id='FAKEC' bottom={0} centerX width={20} height={70}/>
          </Tab>
          <Tab id='CONTENU' title='Contenu' visible={false}>
            <ScrollView stretchX height={250} top={[Constraint.prev, 5]} direction='vertical'>
              <TextView id='SCANLIST' top={[Constraint.prev, 5]} stretchX>CODE ARTICLE;LIBELLE ARTICLE;QTE</TextView>
            </ScrollView>
          </Tab>
        </TabFolder>
      </$>
    );
    $(TextView).only('#SCANLIST').text = $(TextView).only('#SCANLIST').text + "\n";
    $(TextInput).only('#COMPTE').height = $(Button).only('#BOUSCAN').height;
    this.bscan.scaleMode = 'fill';
    this.bscan.on('detect', (e) => this.aladetection(e));
  }

  private fileInit = () => {
    try {
      if (fs.isFile(FICHIER)) {
        void fs.readFile(FICHIER, 'utf-8').catch(ex => console.error(ex)).then((ficlu) => {
          $(TextView).only('#INFOFIC').text = 'Fichier existant : ' + ficlu + ';';
        });
      } else {
        fs.writeFile(FICHIER, 'CODE ARTICLE;LIBELLE ARTICLE;QTE', 'utf-8').catch(ex => console.error(ex));
        $(TextView).only('#INFOFIC').text = 'Fichier initialisé';
        $(Tab).only('#SCAN').visible = true;
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  private wipFic = () => {
    //Normalement a des fins de debuggage
    void fs.removeFile(FICHIER).catch(ex => console.error(ex)).then(() => {
      $(TextView).only('#INFOFIC').text = 'Fichier supprimé';
    });
  }

  private scanResize = () => {
    //Principalement déclanché à l'apparission disparission du clavier
    $(TextView).only('#MARQSC').background = 'blue';
    $(TextView).only('#MARQSC').top = ['#SCAN', 2];
    $(TextView).only('#MARQSC').bottom = ['#FAKEC', 2];
    this.bscan.top = $(TextView).only('#MARQSC').top;
    this.bscan.bottom = $(TextView).only('#MARQSC').bottom;
    this.bscan.appendTo($(Tab).only('#SCAN'));
  }

  private startScanner = () => {
    //Prépare le champs recoltant le comptage
    $(TextInput).only('#COMPTE').enabled = true;
    $(TextInput).only('#COMPTE').focused = true;
    $(TextInput).only('#COMPTE').keepFocus = true;
    if (!this.bscan.active) { //initialise le scaner
      this.bscan.start(['qr']);
    }
  }

  private annulScan = () => {
    //Relance la recolte sans enregistrer le scan encours
    $(TextView).only('#CODART').text = "<b>CODE ARTICLE</b>";
    $(TextView).only('#DESART').text = "LIBELLE ARTICLE";
    $(Button).only('#ANNULER').enabled = false;
    $(TextInput).only('#COMPTE').text = "";
  }

  private aladetection(e: MessageEvent) { //quand une étiquette est lu par la caméra
    const decode = e.data.split('|');
    console.log(decode[4] + " " + decode[5]);
    if (!$(Button).only('#ANNULER').enabled) { //Evite des scans consécutif (par erreur)
      $(TextView).only('#CODART').text = "<b>" + decode[4] + "</b>";
      $(TextView).only('#DESART').text = decode[5];
      $(Button).only('#ANNULER').enabled = true;
      $(TextInput).only('#COMPTE').enabled = true;
    }
  }

  private validScan = () => { //quand l'utilisateur valide le comptage
    if ($(TextInput).only('#COMPTE').text !== "") { //Ne fais rien s'il n'y a pas de chiffre d'entré
      let result = $(TextView).only('#CODART').text;
      //epuration du code article du gras
      result = result.substring(3);
      result = result.substring(0, result.length - 4);
      //rajoute un bout de libellé
      result = result + ";" + $(TextView).only('#DESART').text.substring(0, 20);
      //rajoute la quantite compté
      result = result + ";" + $(TextInput).only('#COMPTE').text;
      console.log(result);
      if (!$(Tab).only('#CONTENU').visible) {
        $(Tab).only('#CONTENU').visible = true;
      }
      $(TextView).only('#SCANLIST').text = $(TextView).only('#SCANLIST').text + result + "\n";
      $(TextInput).only('#COMPTE').text = "";
      this.annulScan();
    }
  }

}
