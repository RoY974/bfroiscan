import {Button, TextView, contentView, Tab, TabFolder, Constraint, TextInput, Row, Widget} from 'tabris';
import {ImageView, Composite, fs, AlertDialog, CollectionView, WidgetPanEvent, app} from 'tabris';

const REPERTOIRE = fs.cacheDir + '/inv';
const NOMFIC = 'scan.csv';
const FICHIER = REPERTOIRE + '/' + NOMFIC;

const items = [
  {icoda: 'CODE ART', ilib: 'LIBELLE', iqte: 'QUANTITE'},
];

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
          <Button id='BINIT' bottom={50} onSelect={this.fileInit}>Initialisation</Button>
            <TextView id='INFOFIC' centerX bottom={[Constraint.prev, 20]} font={{size: 15}}/>
          </Tab>
          <Tab id='SCAN' title='Scanner' visible={false} onResize={this.scanResize}>
            <TextView id='MARQSC' left={10} right={[Constraint.prev, 10]} background='black'>Camera</TextView>
            <Row id='LIGA' stretchX top={[Constraint.prev, 2]} height={25} spacing={5}>
              <TextView id='CODART' markupEnabled font={{size: 15}}><b>CODE ARTICLE</b></TextView>
              <TextView id='DESART' markupEnabled font={{size: 10}} stretchX>LIBELLE ARTICLE</TextView>
              <Button id='ENTMANU' width={30} font={{size: 10}} onSelect={this.Entreemanu}>+</Button>
            </Row>
            <Row id='LIGB' stretchX top={[Constraint.prev, 2]} height={45} spacing={10}>
              <Button id='BOUSCAN' onSelect={this.startScanner}>Scanner</Button>
              <TextInput id='COMPTE' stretchX padding={[5,2,2,5]} font={{size: 17}} onAccept={this.validScan} enterKeyType='done' keyboard='number' enabled={false}/>
              <Button id='ANNULER' onSelect={this.annulScan} enabled={false}>Annuler</Button>
            </Row>
            <Composite id='FAKEC' bottom={0} centerX width={20} height={70}/>
          </Tab>
          <Tab id='CONTENU' title='Contenu' visible={false}>
            <CollectionView id='SCANLIST' stretchX top={2} bottom={50} cellHeight={64} itemCount={2} createCell={this.SLcreateCell} updateCell={SLupdateCell}/>
            <Button id='TERMINE' centerX top={[Constraint.prev, 2]} onSelect={this.goTermine}>Terminer</Button>
          </Tab>
        </TabFolder>
      </$>
    );
    $(TextInput).only('#COMPTE').height = $(Button).only('#BOUSCAN').height;
    this.bscan.scaleMode = 'fill';
    this.bscan.on('detect', (e) => this.aladetection(e));
  }

  private fileInit = () => {
    try {
      if (fs.isFile(FICHIER)) {
        void fs.readFile(FICHIER, 'utf-8').catch(ex => console.error(ex)).then((ficlu) => {
          $(TextView).only('#INFOFIC').text = 'Fichier existant';
          this.recupfichier(ficlu).catch(ex => console.error(ex));
        });
      } else {
        fs.writeFile(FICHIER, 'CODE ARTICLE;LIBELLE ARTICLE;QTE', 'utf-8').catch(ex => console.error(ex));
        $(TextView).only('#INFOFIC').text = 'Fichier initialisé';
        $(Tab).only('#SCAN').visible = true;
        $(Button).only('#BINIT').enabled = false;
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  private async recupfichier(ficlu: string | void) {
    //Si un fichier existe à l'initialisation, suppose que le tel a planté et propose de le reprendre
    const buttons = {ok: 'Oui', cancel: 'Non'};
    const dialog = AlertDialog.open(
      <AlertDialog title='Recupérer fichier' buttons={buttons}>
        Un fichier précédent existe et a été détecté, voulez vous le reprendre ?
      </AlertDialog>
    );
    const {button} = await dialog.onClose.promise();
    if (button === 'ok') {
      if (typeof ficlu === 'string') {
        const ficluT = ficlu.split('\n');
        for (let i = 0; i < ficluT.length; i++) {
          const ligT = ficluT[i].split(';');
          $(CollectionView).only('#SCANLIST').itemCount = items.push({icoda: ligT[0], ilib: ligT[1], iqte: ligT[2]});
        }
      }
      $(Tab).only('#SCAN').visible = true;
      $(Tab).only('#CONTENU').visible = true;
      $(Button).only('#BINIT').enabled = false;
    }
    else {
      console.log(`Annuler`);
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
      let vart = $(TextView).only('#CODART').text;
      //epuration du code article du gras
      vart = vart.substring(3);
      vart = vart.substring(0, vart.length - 4);
      if (vart !== 'CODE ARTICLE') { //Ne fais rien si le scan n'a rien trouvé
        //rajoute un bout de libellé
        const vlib = $(TextView).only('#DESART').text.substring(0, 35);
        //rajoute la quantite compté
        const vqte = $(TextInput).only('#COMPTE').text;
        console.log(vart + ";" + vlib + ";" + vqte);
        if (!$(Tab).only('#CONTENU').visible) {
          $(Tab).only('#CONTENU').visible = true;
        }
        $(CollectionView).only('#SCANLIST').itemCount = items.push({icoda: vart, ilib: vlib, iqte: vqte})
        $(TextInput).only('#COMPTE').text = "";
        this.annulScan();
        if ((items.length % 2) === 0) {
          //Sauvegarde la liste tous les 2 scan
          goSave();
        }
      } 
    }
  }

  private async Entreemanu() {
    const buttons = {ok: 'Modifier', cancel: 'Fermer'};
    const dialog = AlertDialog.open(
      <AlertDialog title='Entrée manuelle' buttons={buttons}>
        Entrer manuellement le code et un descriptif
        <TextInput message='Code article'/>
        <TextInput message='Libellé'/>
      </AlertDialog>
    );
    let entreesmanu: string[];
    let button: string;
    await dialog.onClose.promise().then((e) => {
      entreesmanu = e.texts;
      button = e.button;
      if (button === 'ok') {
        $(TextView).only('#CODART').text = "<b>" + entreesmanu[0] + "</b>";
        $(TextView).only('#DESART').text = entreesmanu[1];
      }
      else {
        console.log(`Annuler et revient au scan`);
      }
    });
  }

  private async goTermine() {
    //Une fois que l'opérateur fini son scan
    goSave();
    const buttons = {ok: 'Confirmer', cancel: 'Annuler'};
    const dialog = AlertDialog.open(
      <AlertDialog title='Cloturer et envoyer' buttons={buttons}>
        Etes vous sur de terminer la saisie et envoyer le fichier ?
      </AlertDialog>
    );
    const {button} = await dialog.onClose.promise();
    if (button === 'ok') {
      console.log(`L'utilisateur confirme`);
      void fs.readFile(FICHIER, 'utf-8').then(data => {
        const file = new File([data], NOMFIC, { type: 'text/csv' });
        app.share({title: 'scan terminé', text: 'Voir PJ', files: [file]}).catch(ex => console.error(ex));
      }).catch(ex => console.error(ex));
    }
    else {
      console.log(`Annuler et revient à la saisie`);
    }
  }

  private SLcreateCell = () => {
    //Methode qui met en forme l'ajout d'une ligne de la CollectionView
    return (
      <Composite background='gray'>
        <Composite id='container' stretch background='white' onPanHorizontal={handlePan}>
          <TextView id='lscodeart' left={16} top={8} font='medium 16px'>codeart</TextView>
          <TextView id='lslibart' left={16} bottom={8}>libart</TextView>
          <TextView id='lsqteart' right={16} top={8} font='medium 16px'>qteart</TextView>
        </Composite>
        <Composite stretchX height={1} background='#eeeeee'/>
      </Composite>
    );
  }
}

function goSave() {
  //Fonction qui sauvegarde les scans dans le fichier
  let contenu = '';
  items.forEach((value) => {
    contenu = contenu + value.icoda + ';' + value.ilib + ';' + value.iqte + '\n';
  })
  fs.writeFile(FICHIER, contenu, 'utf-8').catch(ex => console.error(ex));
}

function SLupdateCell(view: Composite, index: number) {
  //Fonction qui met à jour la ligne de scan avec le contenu scanné
  const item = items[index];
  const container = view.find('#container').only();
  container.data = item;
  container.transform = {translationX: 0};
  view.find(TextView).only('#lscodeart').text = item.icoda;
  view.find(TextView).only('#lslibart').text = item.ilib;
  view.find(TextView).only('#lsqteart').text = item.iqte;
}

//////////// Bloque de code qui gère l'animation de swip pour supprimer un scan
async function handlePan(event: WidgetPanEvent<Composite>) {
  const {target, state, translationX} = event;
  target.transform = {translationX};
  if (state === 'end') {
    await handlePanFinished(event);
  }
}

async function handlePanFinished({target, velocityX, translationX}: WidgetPanEvent<Composite>) {
  const beyondCenter = Math.abs(translationX) > target.bounds.width / 2;
  const fling = Math.abs(velocityX) > 200;
  const sameDirection = direction(velocityX) === direction(translationX);
  // When swiped beyond the center, trigger dismiss if flinged in the same direction or let go.
  // Otherwise, detect a dismiss only if flinged in the same direction.
  const dismiss = beyondCenter ? (sameDirection || !fling) : (sameDirection && fling);
  if (dismiss) {
    await animateDismiss(target, translationX);
  } else {
    await animateCancel(target);
  }
}

async function animateDismiss(target: Composite<Widget>, translationX: number) {
  await target.animate({
    transform: {translationX: direction(translationX) * target.bounds.width}
  }, {
    duration: 200,
    easing: 'ease-out'
  });
  const index = items.indexOf(target.data);
  items.splice(index, 1);
  $(CollectionView).only().remove(index);
}

async function animateCancel(target: Composite<Widget>) {
  return target.animate({transform: {translationX: 0}}, {duration: 200, easing: 'ease-out'});
}

function direction(offset: number) {
  return offset ? offset < 0 ? -1 : 1 : 0;
}
///////////////Fin de bloque du code
